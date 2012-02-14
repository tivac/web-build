(function() {
    JS.readFile = readFile; //simple alias to standardize things
    
    JS.writeFile = function(f, data) {
        var writer = new FileWriter(f);
        
        writer.write(data);
        writer.close();
    };
    
    JS.fileScanner = function(o) {
        var fs = project.createDataType("fileset"),
            files, dir;
        
        if(!o.dir || !o.includes) {
            throw "Must define dir & includes for JS.fileScanner";
        }
        
        fs.setDir(new File(o.dir));
        fs.setIncludes(o.includes);
        o.excludes && fs.setExcludes(o.excludes);
        
        files = fs.getDirectoryScanner(project).getIncludedFiles();
        dir = fs.getDir(project);
        
        return files.map(function(f) {
            return dir + "\\" + f;
        });
    };
}());