/* 
 * Opens all files matching the yui config filter
 * parses them into JS objects
 * renames files according to root + path or fullpath, depending on what exists
 */

importPackage(java.util, java.io);
importPackage(Packages.org.apache.tools.ant);
importPackage(Packages.org.apache.tools.ant.taskdefs);

(function() {
    var p = JS.properties(
            "dir.app.files",
            "filter.js.yui",
            "mapping.js",
            "mapping.css"
        ),
        mappings = {
            js : new Properties(),
            css : new Properties()
        },
        cleaner = /^(var\s[\w\-]+|YUI_config)\s*=\s*/,
        files;
    
    mappings.js.load(new FileReader(p.mapping.js));
    mappings.css.load(new FileReader(p.mapping.css));
    
    JS.fileScanner({ 
        dir : p.dir.app.files, 
        includes : p.filter.js.yui 
    }).forEach(function(file) {
        var original = readFile(file),
            //file vars
            modified = original, 
            js, cfg;
        
        //remove var {app}_config = from the beginning so we can use our own value
        //then make sure it actually was changed before trying to eval the config
        js = original.replace(cleaner, "cfg = ");
        
        if(js === original) {
            self.log("Unable to update references in " + file);
            return;
        }
        
        try {
            eval(js);
        } catch(e) {
            return self.log("Error parsing " + file + ", skipping");
        }
        
        //move modules into groups
        !cfg.groups && (cfg.groups = {});
        cfg.modules && (cfg.groups.__modules__ = { modules : cfg.modules });
        cfg.groups.__modules__ && delete cfg.modules;
        
        //iterate groups
        Object.keys(cfg.groups).forEach(function(g) {
            var group = cfg.groups[g],
                root = group.root || cfg.groups.root || cfg.root || "";
            
            (root.indexOf("/") === 0) && (root = root.slice(1));
            
            //if they don't declare any modules give up
            if(typeof group.modules !== "object") {
                return;
            }
            
            Object.keys(group.modules).forEach(function(m) {
                var module = group.modules[m],
                    path = (module.fullpath || root + module.path),
                    //check mapping file to see if this one was renamed
                    renamed = mappings[module.type || "js"].getProperty(path),
                    regex, matches, key;
                
                if(renamed) {
                    /* This looks insane, it is a little crazy I admit
                     * Need to capture unique chunks to ensure we only get the modules we want
                     * So instead of just searching for module path we hunt down the hierarchy,
                     * group -> module -> path & replace only the path. If the module isn't in
                     * a group it'll check for the special "__modules__" group & skip that section
                     */
                    regex = new RegExp(
                        "(" + 
                        (g !== "__modules__" ? g + "[\\s\\S]+?" : "") + 
                        m + "[\\s\\S]+?" +
                        "(?:full)?path[\\s\\S]+?\")" + 
                        (module.fullpath || module.path)
                    );
                    matches = regex.exec(modified);
                    
                    modified = modified.replace(
                        matches[0], 
                        matches[1] + (module.fullpath ? renamed : renamed.replace(root, ""))
                    );
                }
            });
        });
        
        (original !== modified) && JS.writeFile(file, modified);
    });
}());