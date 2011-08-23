package com.yahoo.platform.build.ant;
import org.apache.tools.ant.BuildException;
import org.apache.tools.ant.DirectoryScanner;
import org.apache.tools.ant.Task;
import org.apache.tools.ant.types.FileSet;
import org.apache.tools.ant.Project;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.MappedByteBuffer;
import java.nio.channels.FileChannel;
import java.util.Iterator;
import java.util.Properties;
import java.util.Vector;
import java.util.zip.CRC32;
import java.util.zip.CheckedInputStream;

/**
 * Use this task like this:
 * <p/>
 * <taskdef name="FileTransform"
 * classname="com.yahoo.platform.build.ant.FileTransform"
 * classpath="${build.dir}/tools/classes"/>
 * <p/>
 * <FileTransform todir="${build.dir}/intermediate/js">
 * <fileset dir="${build.dir}/intermediate/js">
 * <include name="*.js"/>
 * </fileset>
 * </FileTransform>
 * <p/>
 * This task will copy the files specified in the nested fileset, will rename them
 * (replace their base name by the value of their checksum and keep the same extension)
 * and will set an ant property which name is the base name of the original file, and
 * the value is the full name of the destination file.
 */
public class FileTransform extends Task {
    private String todir;
    private boolean changefilenames;
    private boolean moveFiles;
    private String propertiesfile;
    private String additionalText;
    private Vector filesets = new Vector();
    
    public void setTodir(String todir) {
        this.todir = todir;
    }
    
    public void setChangefilenames(boolean changefilenames) {
        this.changefilenames = changefilenames;
    }
    
    public void setPropertiesfile(String propertiesfile) {
        this.propertiesfile = propertiesfile;
    }
    
    public void addFileset(FileSet fileset) {
        filesets.add(fileset);
    }
    
    public void setMoveFiles(boolean moveFiles) {
        this.moveFiles = moveFiles;
    }
    
    public void setAdditionalText(String additionalText) {
        this.additionalText = additionalText;
    }
    
    protected void validate() {
        if (filesets.size() < 1)
            throw new BuildException("fileset not set");
    }
    
    public void execute() {
        validate();
        Properties properties = new Properties();
        
        for (Iterator itFSets = filesets.iterator(); itFSets.hasNext();) {
            FileSet fs = (FileSet) itFSets.next();
            DirectoryScanner ds = fs.getDirectoryScanner(getProject());
            String[] includedFiles = ds.getIncludedFiles();
            
            for (int i = 0; i < includedFiles.length; i++) {
                String file = includedFiles[i];
                File srcFile = new File(ds.getBasedir(), file);
                String srcFilename = srcFile.getName();
                String dstFilename;
                
                log("Processing file " + srcFile.getAbsoluteFile(), Project.MSG_VERBOSE);
                
                try {
                    if (changefilenames) {
                        // Calculate the CRC-32 checksum of this file
                        CheckedInputStream cis = new CheckedInputStream(new FileInputStream(srcFile), new CRC32());
                        byte[] tempBuf = new byte[128];
                        while (cis.read(tempBuf) >= 0) { }
                        long checksum = cis.getChecksum().getValue();
                        cis.close();
                        // Get the file extension
                        int idx = srcFilename.lastIndexOf('.');
                        String extension = "";
                        String additional = (additionalText != null && additionalText.length() != 0) ? "." + additionalText : "";
                        
                        if (idx != -1) {
                            extension = srcFilename.substring(idx);
                        }
                        
                        // Compute the new filename
                        dstFilename = srcFilename.substring(0, idx) + "." + String.valueOf(checksum) + additional + extension;
                    } else {
                        dstFilename = srcFilename;
                    }
                    
                    // Copy or move the file
                    File dstDir = new File((todir != null) ? todir : srcFile.getParent());
                    File dstFile = new File(dstDir, dstFilename);
                    
                    if(moveFiles) {
                        rename(srcFile, dstFile);
                    } else {
                        copy(srcFile, dstFile);
                    }
                    
                    log(((moveFiles) ? "Moved" : "Copied") + " " + srcFile + " to " + dstFile, Project.MSG_VERBOSE);
                    
                    // Set the new property...
                    file = file.replace("\\", "/");
                    properties.setProperty(file, file.replace(srcFilename, dstFilename));
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
        
        if (propertiesfile != null) {
            try {
                properties.store(new FileOutputStream(new File(propertiesfile)), null);
            } catch (IOException e) {
                e.printStackTrace();
                System.exit(1);
            }
            
            log("Stored properties in " + propertiesfile, Project.MSG_VERBOSE);
        }
    }
    
    private static final void copy(File source, File dest) throws IOException {
        FileChannel in = null, out = null;
        try {
            in = new FileInputStream(source).getChannel();
            out = new FileOutputStream(dest).getChannel();
            long size = in.size();
            MappedByteBuffer buf = in.map(FileChannel.MapMode.READ_ONLY, 0, size);
            out.write(buf);
        } finally {
            if (in != null) in.close();
            if (out != null) out.close();
        }
    }
    
    //hacks around JAVA SUCKING ASS courtesy of Levi at http://forums.sun.com/thread.jspa?threadID=276164
    public static final void rename(File oldfile, File newfile) throws IOException {
        if(!oldfile.exists()) {
            throw new IOException("File " + oldfile + " does not exist ");
        }
        
        if(newfile.exists() && !newfile.delete()) {
            if(newfile.exists()) throw new IOException("Cannot delete file " + newfile);
        }
        
        if(!oldfile.renameTo(newfile) && !newfile.exists()) {
            // the biggest hack of all time :) 
            System.gc();
            try {
                Thread.sleep(10);
            }
            catch (InterruptedException e) { }
            
            if(!oldfile.renameTo(newfile) && !newfile.exists()) {
                // give it another try. 
                copy(oldfile, newfile);
                oldfile.delete();
            }
        }
    }

    public static final void delete(File file) {
        if(!file.exists()) return;
        
        // try to delete it first. 
        if(!file.delete()) {
            // ok may be there is some problem in the file handles etc. so do a GC and sleep for some time. 
            System.gc();
            try {
                Thread.sleep(10);
            } catch(InterruptedException ex) { }
            
            // check if you can delete the file now.
            if(! file.delete()) {
                // nope. then ok let java delete it when exiting the system. 
                file.deleteOnExit();
            }
        }
    }
}