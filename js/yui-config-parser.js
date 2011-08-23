/* 
 * Opens all files matching the yui config filter
 * parses them into JS objects
 * renames files according to root + path or fullpath, depending on what exists
 */
 
importPackage(java.util, java.io);
importPackage(Packages.org.apache.tools.ant);
importPackage(Packages.org.apache.tools.ant.taskdefs);
importClass(Packages.org.apache.tools.ant.util.FileUtils);

(function() {
    var _p = {
            dir : {
                app : {
                    files : project.getProperty("dir.app.files")
                }
            },
            filter : {
                js : {
                    yui : project.getProperty("filter.js.yui"),
                }
            },
            mapping : {
                js : project.getProperty("mapping.js"),
                css : project.getProperty("mapping.css")
            },
            service : {
                url : project.getProperty("service.url")
            }
        },
        fs = project.createDataType("fileset"),
        mappings = {},
        cleaner = /^(var\s[\w\-]+|YUI_config)\s*=\s*/,
        dir, files,
        
        //functions
        readFile = function(f) {
            var reader = new FileReader(f),
                out = "" + FileUtils.readFully(reader);
            
            reader.close();
            
            return out;
        },
        writeFile = function(f, data) {
            var writer = new FileWriter(f);
            
            writer.write(data);
            writer.close();
        },
        updateConfig = function(file) {
            var original = readFile(file),
                //file vars
                modified = original, 
                js, cfg,
                //object iteration vars
                group, g, module, m, root, path, renamed;
            
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
                self.log("Error parsing " + file + ", skipping");
                
                return;
            }
            
            //move modules into groups
            !cfg.groups && (cfg.groups = {});
            cfg.modules && (cfg.groups["__modules__"] = modules);
            
            //iterate groups
            for(g in cfg.groups) {
                group = cfg.groups[g];
                root = group.root || cfg.groups.root || "";
                
                (root.indexOf("/") === 0) && (root = root.slice(1));
                (_p.service.url) && (root = root.replace(_p.service.url + "/", ""));
                
                for(m in group.modules) {
                    module = group.modules[m];
                    
                    path = (module.fullpath || root + module.path);
                    
                    //check mapping file to see if this one was renamed
                    renamed = mappings[module.type || "js"].getProperty(path);
                    
                    if(renamed) {
                        modified = module.fullpath ? 
                                    modified.replace(path, renamed) :
                                    modified.replace(module.path, renamed.replace(root, ""));
                    }
                }
            }
            
            (original !== modified) && writeFile(file, modified);
        };
    
    mappings.js  = new Properties();
    mappings.js.load(new FileReader(_p.mapping.js));
    mappings.css = new Properties();
    mappings.css.load(new FileReader(_p.mapping.css));
    
    fs.setDir(new File(_p.dir.app.files));
    fs.setIncludes(_p.filter.js.yui);
    
    files = fs.getDirectoryScanner(project).getIncludedFiles();
    dir = fs.getDir(project);
    
    files.forEach(function(f) {
        updateConfig(dir + "\\" + f);
    });
}());
