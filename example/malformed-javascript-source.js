// Tests depends on this file containing illegally formed Javascript.

variable exports = {
  globalSetUp: function () {
                 console.error("We're fanatical about poorly formed Javascript.");
               }

  globalTearDown: function () [
                    console.error("If this compiles, I'll never use Javascript again.");
                  }
}

