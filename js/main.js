let CANVAS = null;
let CTX = null;
let GUI_CANVAS = null;
let GUI_CTX = null;

let WIDTH = 0;
let HEIGHT = 0;
let ORDER = 0;
let LENGTH = 400;

let VERTEX = [];
let VERTEX_ID = 0;

let CURRENT_ZOOM = { scale: 1, dx: 0, dy: 0 };
let CAMERA = { w1: 0, w2: WIDTH, h1: 0, h2: HEIGHT }
let DEBUG = 0;
let ANIMATE = 1;

class Line {
    constructor(id, x1, y1, x2, y2, order, father, sons) {
        this.my_id = id;
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;

        this.len = Math.sqrt((this.x2 - this.x1) * (this.x2 - this.x1) + (this.y2 - this.y1) * (this.y2 - this.y1));

        this.order = order ? order : 0;
        this.father = father >= 0 ? father : -1;
        this.sons = sons ? sons : [];

        this.update_list = [];

        this.op = 0;
        this.animate_opt = {};
    }
}

Line.prototype.update = function () {
    for (i in this.update_list) {
        this.update_list[i].f(this.update_list[i].arg);
    }
}

Line.prototype.render = function (context) {
    if (this.order == ORDER) {
        context.moveTo(this.x1, this.y1);
        context.lineTo(this.x2, this.y2);
    }
}

Line.prototype.animate_update = function (arg) {
    let self = arg.self;
    let id = arg.id;
    let callback = arg.callback ? arg.callback : null;

    let diff = (Date.now() - self.animate_opt.time1);
    if (ANIMATE) {
        if (self.animate_opt.time_ms > diff) {
            let intermediarie_x1 = self.animate_opt.dx1 * diff / self.animate_opt.time_ms;
            let intermediarie_y1 = self.animate_opt.dy1 * diff / self.animate_opt.time_ms;
            let intermediarie_x2 = self.animate_opt.dx2 * diff / self.animate_opt.time_ms;
            let intermediarie_y2 = self.animate_opt.dy2 * diff / self.animate_opt.time_ms;

            self.x1 = intermediarie_x1 + self.animate_opt.original_x1;
            self.y1 = intermediarie_y1 + self.animate_opt.original_y1;
            self.x2 = intermediarie_x2 + self.animate_opt.original_x2;
            self.y2 = intermediarie_y2 + self.animate_opt.original_y2;
        }
        else {
            self.x1 = self.animate_opt.n_x1;
            self.y1 = self.animate_opt.n_y1;
            self.x2 = self.animate_opt.n_x2;
            self.y2 = self.animate_opt.n_y2;

            self.len = Math.sqrt((self.x2 - self.x1) * (self.x2 - self.x1) + (self.y2 - self.y1) * (self.y2 - self.y1));

            self.update_list.splice(self.update_list.indexOf(id), 1)

            if (callback)
                callback();
        }
    }
    else {
        self.x1 = self.animate_opt.n_x1;
        self.y1 = self.animate_opt.n_y1;
        self.x2 = self.animate_opt.n_x2;
        self.y2 = self.animate_opt.n_y2;

        self.len = Math.sqrt((self.x2 - self.x1) * (self.x2 - self.x1) + (self.y2 - self.y1) * (self.y2 - self.y1));

        self.update_list.splice(self.update_list.indexOf(id), 1)

        if (callback)
            callback();

    }
}

Line.prototype.animate = function (n_x1, n_y1, n_x2, n_y2, time_ms) {
    this.animate_opt = {};
    this.animate_opt.time1 = Date.now();

    this.animate_opt.original_x1 = this.x1;
    this.animate_opt.original_y1 = this.y1;
    this.animate_opt.original_x2 = this.x2;
    this.animate_opt.original_y2 = this.y2;

    this.animate_opt.n_x1 = n_x1;
    this.animate_opt.n_y1 = n_y1;
    this.animate_opt.n_x2 = n_x2;
    this.animate_opt.n_y2 = n_y2;

    this.animate_opt.dx1 = this.animate_opt.n_x1 - this.animate_opt.original_x1;
    this.animate_opt.dy1 = this.animate_opt.n_y1 - this.animate_opt.original_y1;
    this.animate_opt.dx2 = this.animate_opt.n_x2 - this.animate_opt.original_x2;
    this.animate_opt.dy2 = this.animate_opt.n_y2 - this.animate_opt.original_y2;
    this.animate_opt.time_ms = time_ms;

    this.update_list[this.op] = { 'f': this.animate_update, 'arg': { 'self': this, 'id': this.op } };
    this.op++;
}

Line.prototype.onScreen = function () {
    return (this.x1 > CAMERA.w1 && this.x1 < CAMERA.w2 && this.y1 > CAMERA.h1 && this.y1 < CAMERA.h2) ||
        (this.x2 > CAMERA.w1 && this.x2 < CAMERA.w2) && (this.y2 > CAMERA.h1 && this.y2 < CAMERA.h2);
}

function splitLine(line) {
    let force_x = line.x2 - line.x1;
    let force_y = line.y2 - line.y1;

    return [
        {
            'x1': line.x1,
            'y1': line.y1,
            'x2': line.x1 + (force_x * 2 / 6),
            'y2': line.y1 + (force_y * 2 / 6),
        },
        {
            'x1': line.x1 + (force_x * 2 / 6),
            'y1': line.y1 + (force_y * 2 / 6),
            'x2': line.x1 + (force_x * 3 / 6),
            'y2': line.y1 + (force_y * 3 / 6),
        },
        {
            'x1': line.x1 + (force_x * 3 / 6),
            'y1': line.y1 + (force_y * 3 / 6),
            'x2': line.x1 + (force_x * 4 / 6),
            'y2': line.y1 + (force_y * 4 / 6),
        },
        {
            'x1': line.x1 + (force_x * 4 / 6),
            'y1': line.y1 + (force_y * 4 / 6),
            'x2': line.x1 + (force_x * 6 / 6),
            'y2': line.y1 + (force_y * 6 / 6),
        },
    ]
}

function rotate_point(cx, cy, angle, px, py) {
    let s = Math.sin(angle);
    let c = Math.cos(angle);

    // translate point back to origin:
    px -= cx;
    py -= cy;

    // rotate point
    let xnew = px * c - py * s;
    let ynew = px * s + py * c;

    // translate point back:
    px = xnew + cx;
    py = ynew + cy;
    return { 'x': px, 'y': py };
}

function increaseShit() {
    ORDER++;
    let new_v = [];
    let animate_pair = [];

    for (let i in VERTEX) {
        if (VERTEX[i].sons.length == 0) {
            let sd = splitLine(VERTEX[i]);

            animate_pair.push({ 'v0': VERTEX_ID + 1, 'v1': VERTEX_ID + 2 });

            VERTEX[i].sons.push(VERTEX_ID);
            new_v.push(new Line(VERTEX_ID++, sd[0].x1, sd[0].y1, sd[0].x2, sd[0].y2, ORDER, VERTEX[i].my_id));
            VERTEX[i].sons.push(VERTEX_ID);
            new_v.push(new Line(VERTEX_ID++, sd[1].x1, sd[1].y1, sd[1].x2, sd[1].y2, ORDER, VERTEX[i].my_id));
            VERTEX[i].sons.push(VERTEX_ID);
            new_v.push(new Line(VERTEX_ID++, sd[2].x1, sd[2].y1, sd[2].x2, sd[2].y2, ORDER, VERTEX[i].my_id));
            VERTEX[i].sons.push(VERTEX_ID);
            new_v.push(new Line(VERTEX_ID++, sd[3].x1, sd[3].y1, sd[3].x2, sd[3].y2, ORDER, VERTEX[i].my_id));
        }
    }

    for (let i in new_v) {
        VERTEX[new_v[i].my_id] = new_v[i];
    }

    for (let i in animate_pair) {
        let pair = animate_pair[i];
        let p = rotate_point(VERTEX[pair.v0].x1, VERTEX[pair.v0].y1, 60 * Math.PI / 180, VERTEX[pair.v1].x2, VERTEX[pair.v1].y2);

        VERTEX[pair.v0].animate(VERTEX[pair.v0].x1, VERTEX[pair.v0].y1, p.x, p.y, 100);
        VERTEX[pair.v1].animate(p.x, p.y, VERTEX[pair.v1].x2, VERTEX[pair.v1].y2, 100);
    }

}

function decreaseShit() {
    if (ORDER == 0) return;

    ORDER--;
    let del_v = [];

    for (let i in VERTEX) {
        if (VERTEX[i].sons.length == 0 && VERTEX[i].father != -1) {
            let sons = VERTEX[VERTEX[i].father].sons;
            for (let i = 0; i < sons.length; i++) {
                del_v[sons[i]] = 1;
            }
        }
    }

    for (let i in del_v) {
        VERTEX[VERTEX[i].father].sons = [];
        VERTEX_ID--;
        delete VERTEX[i];
    }

}

function setup() {
    let p0 = { 'x': 500, 'y': 450 };
    let p1 = { 'x': p0.x + LENGTH, 'y': p0.y };
    let p2 = rotate_point(p0.x, p0.y, -60 * Math.PI / 180, p1.x, p1.y);

    VERTEX[VERTEX_ID] = new Line(VERTEX_ID++, p0.x, p0.y, p1.x, p1.y);
    VERTEX[VERTEX_ID] = new Line(VERTEX_ID++, p1.x, p1.y, p2.x, p2.y);
    VERTEX[VERTEX_ID] = new Line(VERTEX_ID++, p2.x, p2.y, p0.x, p0.y);

    requestAnimationFrame(render);
}

function simpleHash(r, i) {
    return Math.round(r * Math.PI * 1000 * Math.exp(i)) % 256
}

function render() {

    CTX.setTransform(1, 0, 0, 1, 0, 0);
    CTX.clearRect(0, 0, WIDTH, HEIGHT);

    let { scale, dx, dy } = CURRENT_ZOOM;
    CTX.setTransform(scale, 0, 0, scale, dx, dy);

    if (DEBUG) {

        let i = 0;
        let w = 25;
        while (i < 100) {
            CTX.strokeStyle = "rgb(" + simpleHash(Math.floor(i / 4), 1) + "," + simpleHash(Math.ceil(i / 4), 2) + "," + simpleHash(Math.ceil(i / 4), 3) + ")";
            CTX.font = "bold 10px Sans-Serif";
            CTX.fillText(i + 1, 10 + w * i, w);
            CTX.fillText(i + 1, 10 + 0, w * (i + 1));

            CTX.strokeRect(w * i, 0, w, w);
            CTX.strokeRect(0, w * i, w, w);
            i++;
        }

    }

    
    CTX.strokeStyle = "rgb(0,0,0)";
    CTX.lineWidth = 1 / CURRENT_ZOOM.scale;
    CTX.beginPath();
    for (let i in VERTEX) {
        VERTEX[i].update();
        if (VERTEX[i].onScreen()) {
            VERTEX[i].render(CTX);
        }
    }
    CTX.closePath();
    CTX.stroke();

    requestAnimationFrame(render);
}

// s2 bacon
let zoom = (cx, cy, newScale) => {
    let { scale, dx, dy } = CURRENT_ZOOM;
    let ox = (cx - dx) / scale;
    let oy = (cy - dy) / scale;
    let newDx = cx - ox * newScale;
    let newDy = cy - oy * newScale;

    CURRENT_ZOOM.scale = newScale;
    CURRENT_ZOOM.dx = newDx;
    CURRENT_ZOOM.dy = newDy;
};

function simpliflyValue(x) {
    return Math.round(x * 100) / 100;
}

function updateGUI() {
    GUI_CTX.clearRect(0, 0, 200, 280);

    GUI_CTX.fillStyle = "rgba(255,255,255,0.7)"
    GUI_CTX.fillRect(0, 0, 200, 280);
    GUI_CTX.strokeRect(0, 0, 200, 280);

    GUI_CTX.fillStyle = "rgb(0,0,0)"
    GUI_CTX.font = "bold 25px Sans-Serif";
    GUI_CTX.fillText("Commands", 20, 30 + 5);
    GUI_CTX.font = "15px Sans-Serif";
    GUI_CTX.fillText("- W | Increase order", 20, 50 + 5);
    GUI_CTX.fillText("- S  | Decrease order", 20, 70 + 5);
    GUI_CTX.fillText("- Mouse Scroll | Zoom", 20, 90 + 5);
    
    GUI_CTX.fillStyle = "rgb(200,0,0)";
    if(DEBUG){
        GUI_CTX.fillStyle = "rgb(0,200,0)";
    }
    GUI_CTX.fillText("- Z |  DEBUG", 20, 110 + 5);

    GUI_CTX.fillStyle = "rgb(200,0,0)";
    if (ANIMATE) {
        GUI_CTX.fillStyle = "rgb(0,200,0)";
    }
    GUI_CTX.fillText("- A |  ANIMATION", 20, 130 + 5);
    
    if (DEBUG) {
        GUI_CTX.fillStyle = "rgb(100,200,100)";
        GUI_CTX.font = "italic 15px Sans-Serif";
        GUI_CTX.fillText("- ZOOM.scale  " + simpliflyValue(CURRENT_ZOOM.scale), 20, 170 + 5);
        GUI_CTX.fillText("- ZOOM.dx     " + simpliflyValue(CURRENT_ZOOM.dx), 20, 190 + 5);
        GUI_CTX.fillText("- ZOOM.dy     " + simpliflyValue(CURRENT_ZOOM.dy), 20, 210 + 5);
        GUI_CTX.fillText("- CAM W    " + simpliflyValue(CAMERA.w1) + " " + simpliflyValue(CAMERA.w2), 20, 230 + 5);
        GUI_CTX.fillText("- CAM H    " + simpliflyValue(CAMERA.h1) + " " + simpliflyValue(CAMERA.h2), 20, 250 + 5);
    }
}

window.onload = () => {
    CANVAS = document.querySelector('#my_canvas');
    CTX = CANVAS.getContext('2d');

    GUI_CANVAS = document.querySelector('#gui_canvas');
    GUI_CTX = GUI_CANVAS.getContext('2d');

    WIDTH = CANVAS.width = document.body.clientWidth;
    HEIGHT = CANVAS.height = document.body.clientHeight;

    GUI_CANVAS.width = 200;
    GUI_CANVAS.height = 280;

    CAMERA.w2 = WIDTH;
    CAMERA.h2 = HEIGHT;

    setup();
    updateGUI();

    // s2 bacon
    CANVAS.addEventListener("wheel", e => {
        let { scale } = CURRENT_ZOOM;
        let newScale = Math.exp(Math.log(scale) - e.deltaY / 1000);
        zoom(e.offsetX, e.offsetY, newScale);

        CAMERA.w1 = -CURRENT_ZOOM.dx / CURRENT_ZOOM.scale;
        CAMERA.w2 = CAMERA.w1 + (WIDTH / CURRENT_ZOOM.scale)
        CAMERA.h1 = -CURRENT_ZOOM.dy / CURRENT_ZOOM.scale;
        CAMERA.h2 = CAMERA.w1 + (HEIGHT / CURRENT_ZOOM.scale)

        updateGUI();
    });
}

window.addEventListener('keypress', (event) => {
    if (event.code == 'KeyW') {
        increaseShit();
    }
    else if (event.code == 'KeyS') {
        decreaseShit();
    }
    else if (event.code == 'KeyZ') {
        DEBUG = !DEBUG;
        updateGUI();
    }
    else if (event.code == 'KeyA') {
        ANIMATE = !ANIMATE;
        updateGUI();
    }
})