(function() {
    
    var objectify = function(s, root, value) {
        
        //root is optional
        root && typeof root === "object" || (root = {});
        
        var segments = s.split("."),
            o = root,
            i = 0, il = segments.length - 1;

        for (; i < il; ++i) {
            o = segments[i].length && o[segments[i]] || (o[segments[i]] = {});
        }
        
        o[segments[i]] = value;
        
        return root;
    };
    
    JS.properties = function() {
        var args = Array.prototype.slice.call(arguments),
            o = {};
        
        args.forEach(function(arg) {
            var prop = "" + project.getProperty(arg).toString();
            
            if(prop) {
                objectify(arg, o, prop);
            }
        });
        
        return o;
    };
    
}());