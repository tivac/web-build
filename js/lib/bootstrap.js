importPackage(java.io);
importClass(Packages.org.apache.tools.ant.util.FileUtils);

//set up global object & fake out a console.log
var JS = {},
    console = { 
        log : function() {
            Array.prototype.slice.call(arguments).forEach(function(arg) {
                try {
                    self.log(JSON.stringify(arg, null, 4));
                } catch(e) {
                    self.log(arg);
                }
            });
        }
    };

//no reason to leak anything else
(function() {
    var buildDir = project.getProperty("dir.build"),
        fs = project.createDataType("fileset"),
        files, dir, uses;
    
    //load all the lib code
    fs.setDir(new File(buildDir + "/js/lib"));
    fs.setIncludes("**/*.js");
    fs.setExcludes("**/bootstrap.js");
    
    files = fs.getDirectoryScanner(project).getIncludedFiles();
    dir = fs.getDir(project);
    
    files.forEach(function(f) {
        load(dir + "/" + f);
    });
    
    //finally load the actual script they asked for
    load(project.getProperty("src.safe"));
}());