/*
 * task this generates:
 * <replace file="${app.public.dir}${sep}${file}" token="${token}" value="${value}" />
 */

importPackage(java.lang, java.util, java.io);
importPackage(Packages.org.apache.tools.ant);
importPackage(Packages.org.apache.tools.ant.taskdefs);
importClass(Packages.org.apache.tools.ant.util.FileUtils);

(function() {
    var fs = project.createDataType("fileset"),
        pub = project.getProperty("dir.app.files"),
        i = 0,
        regex = /<script\s[^\>]*src=["']((?:\/|\.\.\/)[^"']+)["'][^\>]*><\/script>/ig,
        
        //functions
        readFile = function(f) {
            var out = "",
                reader;
            
            try {
                reader = new FileReader(f);
                
                out += FileUtils.readFully(reader);
            
                reader.close();
            } catch(e) {
                //silently fail if it was a FileNotFoundException
                if(e.message.indexOf("java.io.FileNotFoundException") == -1) {
                    self.log("Exception when trying to include JS source");
                    self.log(f);
                    self.log(e);
                }
            }
            
            return out;
        },
        dir, files, results;
        
    fs.setDir(new File(project.getProperty("dir.app.temp")));
    fs.setIncludes(project.getProperty("filter.markup"));
    
    files = fs.getDirectoryScanner(project).getIncludedFiles();
    dir = fs.getDir(project);
    
    files.forEach(function(f) {
        var markup = readFile(dir + "/" + f),
            js, replace;
        
        results = regex.exec(markup);
        
        while(results) {
            //read file in, use an ant replace task to update the file
            if(results && results.length) {
                js = readFile(dir + "/" + f);
                
                //bail if we didn't get contents
                if(js) {
                    replace = project.createTask("replace");
                    replace.setFile(new File(dir, f));
                    replace.setToken(results[0]);
                    replace.setValue("<script>" + js + "</script>");
                    
                    replace.execute();
                }
            }
            
            results = regex.exec(markup);
        }
    });
}());