const cryptoNode = require('crypto');
export const v4 = () => cryptoNode.randomUUID();
export const NIL = '00000000-0000-0000-0000-000000000000';
export default { v4, NIL };
