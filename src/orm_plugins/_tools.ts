export function prependHook(hooks: FxOrmNS.Hooks, hookName: string, preLogic: Function) {
	if (typeof hooks[hookName] === 'function') {
		var oldHook = hooks[hookName];
		
		function callOldHook (next) {
            if (typeof oldHook === 'function') {
                if (oldHook.length > 0)
                    return oldHook.call(this, next)
                
				oldHook.call(this)
			}
			
			next()
		}
		
		hooks[hookName] = function (next) {
			if (preLogic.length > 0) {
				return preLogic.call(this, next)
			}

			preLogic.call(this)
			callOldHook.call(this, next)
		};
	} else {
		hooks[hookName] = preLogic;
	}
}