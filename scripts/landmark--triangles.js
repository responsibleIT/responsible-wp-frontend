///////////////////
// COLOR LOTTERY //
/////////////////// 

const triangleColorLeftLottery = Math.floor( Math.random() * 5 ) + 1;
const triangleColorRightLottery = Math.floor( Math.random() * 5 ) + 1;

setAttr("data-triangle-color-left-lottery", triangleColorLeftLottery);
setAttr("data-triangle-color-right-lottery", triangleColorRightLottery);