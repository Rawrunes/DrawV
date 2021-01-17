// https://github.com/kittykatattack/learningPixi#keyboard

function keyboard(value) 
{
    let key = {};
    key.value = value;
    key.isDown = false;
    key.isUp = true;
    key.press = undefined;
    key.release = undefined;
    //The `downHandler`
    key.downHandler = event => {
      if (event.key === key.value) {
        if (key.isUp && key.press) key.press();
        key.isDown = true;
        key.isUp = false;
        event.preventDefault();
      }
    };
  
    //The `upHandler`
    key.upHandler = event => {
      if (event.key === key.value) {
        if (key.isDown && key.release) key.release();
        key.isDown = false;
        key.isUp = true;
        event.preventDefault();
      }
    };
  
    //Attach event listeners
    const downListener = key.downHandler.bind(key);
    const upListener = key.upHandler.bind(key);
    
    window.addEventListener(
      "keydown", downListener, false
    );
    window.addEventListener(
      "keyup", upListener, false
    );
    
    // Detach event listeners
    key.unsubscribe = () => {
      window.removeEventListener("keydown", downListener);
      window.removeEventListener("keyup", upListener);
    };
    
    return key;
}

let undoBtn = keyboard("z");

undoBtn.press = () => 
{
    undo();
}
undoBtn.release = () => 
{
}

let eraserBtn = keyboard("e");

eraserBtn.press = () => 
{
    eraser()
}
eraserBtn.release = () => 
{
}

let brushBtn = keyboard("b");

brushBtn.press = () => 
{
    brush();
}
brushBtn.release = () => 
{
}