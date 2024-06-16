function dispConfetti() {
  (function () {
    window.requestAnimationFrame =
      window.requestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.webkitRequestAnimationFrame;
    var canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      var ctx = canvas.getContext('2d');
      ctx.globalCompositeOperation = 'source-over';
      var particles = [];
      var pIndex = 0;
      var x, y, frameId;
      function Dot(x, y, vx, vy, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        particles[pIndex] = this;
        this.id = pIndex;
        pIndex++;
        this.life = 0;
        this.maxlife = 1000;
        this.degree = getRandom(0, 360);
        this.size = Math.floor(getRandom(5, 7));
      }

      Dot.prototype.draw = function (x, y) {
        this.degree += 1;
        this.vx *= 0.99;
        this.vy *= 0.999;
        this.x += this.vx + Math.cos((this.degree * Math.PI) / 400);
        this.y += this.vy;
        this.width = this.size;
        this.height = Math.cos((this.degree * Math.PI) / 20) * this.size;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x + this.x / 2, this.y + this.y / 2);
        ctx.lineTo(
          this.x + this.x / 2 + this.width / 2,
          this.y + this.y / 2 + this.height
        );
        ctx.lineTo(
          this.x + this.x / 2 + this.width + this.width / 2,
          this.y + this.y / 2 + this.height
        );
        ctx.lineTo(this.x + this.x / 2 + this.width, this.y + this.y / 2);
        ctx.closePath();
        ctx.fill();
        this.life++;
        if (this.life >= this.maxlife) {
          delete particles[this.id];
        }
      };
      window.addEventListener('resize', function () {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        x = canvas.width / 1;
        y = canvas.height / 1;
      });

      function loop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (frameId % 1 == 0) {
          new Dot(
            canvas.width * Math.random() -
              canvas.width +
              canvas.width * Math.random(),
            -canvas.height / 2,
            getRandom(1, 3),
            getRandom(2, 4),
            '#f9e7c3'
          );
          new Dot(
            canvas.width * Math.random() -
              canvas.width +
              canvas.width * Math.random(),
            -canvas.height / 2,
            getRandom(1, 3),
            getRandom(2, 4),
            '#e3b458'
          );
          new Dot(
            canvas.width * Math.random() -
              canvas.width +
              canvas.width * Math.random(),
            -canvas.height / 2,
            getRandom(1, 3),
            getRandom(2, 4),
            '#9d7d1d'
          );
        }
        for (var i in particles) {
          particles[i].draw();
        }
        frameId = requestAnimationFrame(loop);
      }

      loop();

      function getRandom(min, max) {
        return Math.random() * (max - min) + min;
      }
    }
  })();
}
