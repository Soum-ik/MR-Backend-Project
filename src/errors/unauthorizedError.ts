class UnAuthorize extends Error {
    constructor(message: string, stack = '') {
      super(message);
  
      if (stack) {
        this.stack = stack;
      } else {
        Error.captureStackTrace(this, this.constructor);
      }
    }
  }
  
  export default UnAuthorize;
  