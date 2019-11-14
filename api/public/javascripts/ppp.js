function select() {
    let randomNumber = Math.random();
    let i = 0;
    var wheel = SVG("#wheel");
    while (randomNumber > foodRatios[i][1]) {
      randomNumber -= foodRatios[i][1];
      i++;
    }
    return i;
  }
  function spin() {
    document.getElementById("svg").style.display = "block";
    var i = select();
    var wheel = SVG("#wheel");
    var currentRotation = wheel.transform().rotate;
    wheel.animate(3000, "<>").rotate(i * 60 + 30 - currentRotation + 720);
  }
  
  var foodRatios = [
    ["Pizza", 0.35],
    ["Pasta", 0.25],
    ["Chicken", 0.25],
    ["Free Admission", 0],
    ["Dessert", 0.15],
    ["Pineapple", 0]
  ];
  var wheel = SVG("#wheel");