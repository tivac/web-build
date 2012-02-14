/*
 * task this generates:
 * <replace file="${app.public.dir}${sep}${file}" token="${token}" value="${value}" />
 */

importPackage(Packages.org.apache.tools.ant);
importPackage(Packages.org.apache.tools.ant.taskdefs);

(function() {
    var p = JS.properties(
            "dir.app.files",
            "dir.app.temp",
            "filter.markup"
        ),
        i = 0,
        regex = /<script\s[^\>]*src=["']((?:\/|\.\.\/)[^"']+)["'][^\>]*><\/script>/ig,
        files;
    
    files = JS.fileScanner({
        dir : p.dir.app.temp,
        includes : p.filter.markup
    });
    
    files.forEach(function(f) {
        var html = readFile(f),
            results = regex.exec(html),
            source, replace;
        
        while(results) {
            //read file in, use an ant replace task to update the file
            if(results && results.length) {
                try {
                    source = readFile(p.dir.app.files + results[1]);
                } catch(e) { 
                    //bail if we didn't get contents
                    return; 
                }
                
                replace = project.createTask("replace");
                replace.setFile(new File(f));
                replace.setToken(results[0]);
                replace.setValue("<script>" + source + "</script>");
                
                replace.execute();
            }
            
            results = regex.exec(html);
        }
    });
}());
