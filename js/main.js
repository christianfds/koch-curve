let CANVAS = null;
let CTX = null;
let WIDTH = 0;
let HEIGHT = 0;
let ORDER = 0;
let LENGTH = 400;

let VERTEX = [];
let VERTEX_ID = 0;

class Line {
    constructor(id, x1, y1, x2, y2, order, father, sons) {
        this.my_id = id;
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;

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
    if (!this.sons.length) {
        context.lineWidth = 1;
        context.moveTo(this.x1, this.y1);
        context.lineTo(this.x2, this.y2);
        context.stroke();
    }
}

Line.prototype.animate_update = function (arg) {
    let self = arg.self;
    let id = arg.id;
    let callback = arg.callback ? arg.callback : null;

    let diff = (Date.now() - self.animate_opt.time1);
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

    for (v of VERTEX) {
        if (v && v.sons.length == 0) {
            let sd = splitLine(v);

            animate_pair.push({ 'v0': VERTEX_ID + 1, 'v1': VERTEX_ID + 2 });

            const father_id = v.my_id;

            v.sons.push(VERTEX_ID);
            new_v.push(new Line(VERTEX_ID++, sd[0].x1, sd[0].y1, sd[0].x2, sd[0].y2, ORDER, v.my_id));
            v.sons.push(VERTEX_ID);
            new_v.push(new Line(VERTEX_ID++, sd[1].x1, sd[1].y1, sd[1].x2, sd[1].y2, ORDER, v.my_id));
            v.sons.push(VERTEX_ID);
            new_v.push(new Line(VERTEX_ID++, sd[2].x1, sd[2].y1, sd[2].x2, sd[2].y2, ORDER, v.my_id));
            v.sons.push(VERTEX_ID);
            new_v.push(new Line(VERTEX_ID++, sd[3].x1, sd[3].y1, sd[3].x2, sd[3].y2, ORDER, v.my_id));
        }
    }


    for (v of new_v) {
        VERTEX[v.my_id] = v;
    }

    for (pair of animate_pair) {
        let p = rotate_point(VERTEX[pair.v0].x1, VERTEX[pair.v0].y1, 60 * Math.PI / 180, VERTEX[pair.v1].x2, VERTEX[pair.v1].y2);

        VERTEX[pair.v0].animate(VERTEX[pair.v0].x1, VERTEX[pair.v0].y1, p.x, p.y, 500);
        VERTEX[pair.v1].animate(p.x, p.y, VERTEX[pair.v1].x2, VERTEX[pair.v1].y2, 500);
    }

}

function decreaseShit() {
    if (ORDER == 0) return;

    ORDER--;
    let del_v = [];
    let animate_pair = [];

    for (v of VERTEX) {
        if (v && v.sons.length == 0 && v.father != -1) {
            for (let i = 0; i < VERTEX[v.father].sons.length; i++) {
                del_v[VERTEX[v.father].sons[i]] = 1;
            }
        }
    }

    for (i in del_v) {
        VERTEX[VERTEX[i].father].sons = [];
        
        delete VERTEX[i];
    }
    // for(v in del_v){
    // }

    // for (v of new_v) {
    //     VERTEX[v.my_id] = v;
    // }

    // for (pair of animate_pair) {
    //     let p = rotate_point(VERTEX[pair.v0].x1, VERTEX[pair.v0].y1, 60 * Math.PI / 180, VERTEX[pair.v1].x2, VERTEX[pair.v1].y2);

    //     VERTEX[pair.v0].animate(VERTEX[pair.v0].x1, VERTEX[pair.v0].y1, p.x, p.y, 500);
    //     VERTEX[pair.v1].animate(p.x, p.y, VERTEX[pair.v1].x2, VERTEX[pair.v1].y2, 500);
    // }

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

function render() {

    CANVAS.width = CANVAS.width;

    for (l of VERTEX) {
        if(l){
            l.update();
            l.render(CTX);
        }
    }

    CTX.font = "bold 25px Sans-Serif";
    CTX.fillText("Comandos", 10, 30);
    CTX.font = "15px Sans-Serif";
    CTX.fillText("- W | Increase order", 10, 50);
    CTX.fillText("- S  | Decrease order", 10, 70);

    requestAnimationFrame(render);
}

window.onload = () => {
    CANVAS = document.querySelector('#my_canvas');
    CTX = CANVAS.getContext('2d');

    WIDTH = CANVAS.width = document.body.clientWidth;
    HEIGHT = CANVAS.height = document.body.clientHeight - 3;

    setup();
}

window.addEventListener('keypress', (event) => {
    if (event.code == 'KeyW') {
        increaseShit();
    }
    else if (event.code == 'KeyS') {
        decreaseShit();
    }
})