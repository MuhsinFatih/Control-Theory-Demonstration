// First, checks if it isn't implemented yet.
if (!String.prototype.format) {
    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined' ?
                args[number] :
                match;
        });
    };
}
var Algorithm = {
    bangbang: 'bangbang',
    P: 'P',
    I: 'I',
    D: 'D',
}
var algorithm = Algorithm.bangbang

var svgns = "http://www.w3.org/2000/svg";
document.addEventListener("DOMContentLoaded", function (event) {

    var svg = document.getElementById("svg");

    var variables = document.getElementById("info");
    variables.style.fontFamily = "Menlo"
    // variables.style.fontWeight = "bold"

    document.addEventListener('keydown', (event) => {
        const keyName = event.key;

        switch (keyName) {
            case "ArrowUp":
                desiredVelY += 10
                break;
            case "ArrowDown":
                desiredVelY -= 10
                break;
            case "ArrowRight":
                desiredVelX += 10
                break;
            case "ArrowLeft":
                desiredVelX -= 10
                break;
            case "b":
                algorithm = Algorithm.bangbang
                break;
            case "p":
                algorithm = Algorithm.P
                break;
            case "i":
                algorithm = Algorithm.I
                break;
            case "d":
                algorithm = Algorithm.D
                break;
            default:
                break;
        }

    })

    Number.prototype.showSign = function (n) {
        n = this.valueOf()
        return (n.toString()[0] == '-' ? '' : '+') + n
    }
    String.prototype.showSign = function () {
        return (this[0] == '-' ? '' : '+') + this
    }
    var targetX = 0,
        targetY = 0,
        pose_x = 30,
        pose_y = 30,
        velX = 15,
        velY = 0,
        forceX = 0,
        forceY = 0,
        eX = 0,
        eY = 0;

    var desiredVelX = 30;
    var desiredVelY = 0;
    var slowCount = 1

    var vehicle = document.createElementNS(svgns, "circle")
    vehicle.setAttribute('r', 10)
    vehicle.setAttribute('cx', 25)
    vehicle.setAttribute('cy', 25)
    vehicle.setAttribute('fill', "#222")
    svg.appendChild(vehicle)

    // 60 fps
    persec = 4
    fps = 60
    var graphCounter = 0;
    var chart_n = (fps / persec) * 3
    var chart_eX = new Chart(new Array(chart_n).fill(0), document.getElementById("eX"))
    var last_ex = new Array(chart_n).fill(0)
    var chart_eY = new Chart(new Array(chart_n).fill(0), document.getElementById("eY"))
    var last_ey = new Array(chart_n).fill(0)
    
    function draw() {
        // vehicle.setAttribute()
        vehicle.setAttribute('cx', pose_x)
        vehicle.setAttribute('cy', pose_y)
        if (graphCounter++ % (fps / persec) == 0) {
            for (var i = 0; i < last_ex.length - 1; i++) {
                last_ex[i] = last_ex[i + 1]
            }
            for (var i = 0; i < last_ey.length - 1; i++) {
                last_ey[i] = last_ey[i + 1]
            }
            last_ex[last_ex.length - 1] = eX
            chart_eX.draw(last_ex, (fps / persec) * 3, 30)
            last_ey[last_ey.length - 1] = eY
            chart_eY.draw(last_ey, (fps / persec) * 3, 30)
        }
        if (slowCount++ >= 3) {
            
            var ht = format('<span style="color:green">velX:</span> %s %s\t<span style="color:green">desiredVelX:</span> %s<br><span style="color:purple">velY:</span> %s %s\t <span style="color:purple">desiredVelY:</span> %s',
                velX.toFixed(2).showSign(), (desiredVelX - velX).toFixed(2).showSign(), desiredVelX.toFixed(2).showSign(), velY.toFixed(2).showSign(), (desiredVelY - velY).toFixed(2).showSign(), desiredVelY.toFixed(2).showSign())
            ht += format('<br><span style="color:green">gasX:</span> %s', forceX.toFixed(2).showSign())
            ht += format('<br><span style="color:green">gasY:</span> %s', forceY.toFixed(2).showSign())
            ht += "<br>algorithm: " + algorithm.toString()
            variables.innerHTML = ht
            slowCount = 0;
        }
    }

    function phys() {
        var rect = svg.getBoundingClientRect()
        if (pose_x < 0) pose_x = rect.width - pose_x;
        if (pose_y < 0) pose_y = rect.height - pose_y;
        pose_x = (pose_x + velX / 10) % rect.width
        pose_y = (pose_y + (-velY) / 10) % rect.height

        if (controllerCounter++ % (fps / persec) == 0) controller();

        draw();

        setTimeout(phys, 1000 / fps);
    }

    // var bias = (Math.random() - 0.5) * 50
    // bias += Math.sign(bias) * 50


    function disturb(val) {
        return (Math.random() - 0.5) * 10 * (1 / (1 + Math.exp(-Math.abs(val)))) // + bias
    }
    var frictionX = 0,
        frictionY = 0
    var maxAccel = 200
    // push : between 0 - 100
    function accelerator(pushX, pushY) {
        k = 0.5 // friction coefficient
        mg = 100

        if (Math.abs(pushX) > 200) pushX = Math.sign(pushX) * 200
        if (Math.abs(pushY) > 200) pushY = Math.sign(pushY) * 200

        frictionX = (velX >= 0 ? k * mg : -k * mg)
        frictionY = (velY >= 0 ? k * mg : -k * mg)
        forceX = pushX - frictionX // sigmoid error rate
        velX += (forceX + disturb(velX)) * 1 / fps

        forceY = pushY - frictionY // sigmoid error rate
        velY += (forceY + disturb(velY)) * 1 / fps

    }

    var controllerCounter = 0
    var Sum_eX = 0
    var Sum_eY = 0
    function controller() {
        pushX = 0
        pushY = 0
        Kp = 3 * (fps / persec)
        Ki = 1 * (fps / persec)
        Kd = 0

        eX = desiredVelX - velX
        eY = desiredVelY - velY

        if (Math.abs(eX) < 1 / 10) eX = 0
        if (Math.abs(eY) < 1 / 10) eY = 0

        var pushX, pushY
        switch (algorithm) {
            case Algorithm.bangbang:
                pushX = (eX >= 0) ? 200 : -200
                pushY = (eY >= 0) ? 200 : -200
                break;
            case Algorithm.D:
                //TODO: implement
            case Algorithm.I:
                Sum_e += e
                pushX += Ki * Sum_eX
                pushY += Ki * Sum_eY
                // don't break!
            case Algorithm.P:
                pushX += Kp * eX
                pushY += Kp * eY
                break;
            default:
                break;

            }
            accelerator(pushX, pushY)

    }


    phys();
















})



class Chart {
    // points = []
    // lines = []
    // svg = null
    constructor(array, svg) {
        this.points = []
        this.lines = []
        this.svg = svg
        for (var i = 1; i < array.length; i++) {
            var c = document.createElementNS(svgns, "line")
            c.setAttribute('stroke', "#000")
            c.setAttribute('stroke-width', "1")
            c.setAttribute('opacity', "0.5")
            this.svg.appendChild(c)
            this.lines.push(c)
        }

        this.svg.appendChild(c)
        for (var i = 0; i < array.length; i++) {
            var c = document.createElementNS(svgns, "circle")
            c.setAttribute('r', 1)
            this.svg.appendChild(c)
            this.points.push(c)
        }
        this.draw = function (array, rangeX, rangeY) {
            var h = this.svg.height.animVal.value / 2
            var yy = this.svg.height.animVal.value / rangeY / 2
            var xx = this.svg.width.animVal.value / rangeX
            // for (var i = 0; i < array.length; i++) {
            //     this.points[i].setAttribute("cy",array[i] * h / rangeY + this.svg.height.animVal.value / 2)
            //     this.points[i].setAttribute("cx",i * this.svg.width.animVal.value / rangeX)
            // }
            // console.log(this.svg.getBoundingClientRect().width / rangeX)
            for (var i = 0; i < array.length - 1; i++) {
                var y1 = array[i] * yy + h
                var y2 = array[i + 1] * yy + h
                var x1 = i * xx
                var x2 = (i + 1) * xx
                this.lines[i].setAttribute("y1", y1)
                this.lines[i].setAttribute("y2", y2)
                this.lines[i].setAttribute("x1", x1)
                this.lines[i].setAttribute("x2", x2)

            }
        }

        this.draw(array, (fps / persec) * 3, 200)
    }
}


function format(fmt) {
    var argIndex = 1 // skip initial format argument
        ,
        args = [].slice.call(arguments),
        i = 0,
        n = fmt.length,
        result = '',
        c, escaped = false,
        arg, tmp, leadingZero = false,
        precision, nextArg = function () {
            return args[argIndex++];
        },
        slurpNumber = function () {
            var digits = '';
            while (/\d/.test(fmt[i])) {
                digits += fmt[i++];
                c = fmt[i];
            }
            return digits.length > 0 ? parseInt(digits) : null;
        };
    for (; i < n; ++i) {
        c = fmt[i];
        if (escaped) {
            escaped = false;
            if (c == '.') {
                leadingZero = false;
                c = fmt[++i];
            } else if (c == '0' && fmt[i + 1] == '.') {
                leadingZero = true;
                i += 2;
                c = fmt[i];
            } else {
                leadingZero = true;
            }
            precision = slurpNumber();
            switch (c) {
                case 'b': // number in binary
                    result += parseInt(nextArg(), 10).toString(2);
                    break;
                case 'c': // character
                    arg = nextArg();
                    if (typeof arg === 'string' || arg instanceof String)
                        result += arg;
                    else
                        result += String.fromCharCode(parseInt(arg, 10));
                    break;
                case 'd': // number in decimal
                    result += parseInt(nextArg(), 10);
                    break;
                case 'f': // floating point number
                    tmp = String(parseFloat(nextArg()).toFixed(precision || 6));
                    result += leadingZero ? tmp : tmp.replace(/^0/, '');
                    break;
                case 'j': // JSON
                    result += JSON.stringify(nextArg());
                    break;
                case 'o': // number in octal
                    result += '0' + parseInt(nextArg(), 10).toString(8);
                    break;
                case 's': // string
                    result += nextArg();
                    break;
                case 'x': // lowercase hexadecimal
                    result += '0x' + parseInt(nextArg(), 10).toString(16);
                    break;
                case 'X': // uppercase hexadecimal
                    result += '0x' + parseInt(nextArg(), 10).toString(16).toUpperCase();
                    break;
                default:
                    result += c;
                    break;
            }
        } else if (c === '%') {
            escaped = true;
        } else {
            result += c;
        }
    }
    return result;
}