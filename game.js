'use strict';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  plus(vector) {
    if(!(vector instanceof Vector)) {
      throw new Error('Можно прибавлять к вектору только вектор типа Vector');
    }

    return new Vector(this.x + vector.x, this.y + vector.y);
  }

  times(mult) {
    return new Vector(this.x * mult, this.y * mult);
  }
}

class Actor {
  constructor(position = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
    if(!(position instanceof Vector) || !(size instanceof Vector) || !(speed instanceof Vector)) {
      // форматирование
    throw new Error('Некорректные аргументы.');
    }
    this.pos = position;
    this.size = size;
    this.speed = speed;
  }

  get left() {
    return this.pos.x;
  }

  get top() {
    return this.pos.y ;
  }

  get right() {
    return this.pos.x + this.size.x;
  }

  get bottom() {
    return this.pos.y + this.size.y;
  }

  get type() {
    return 'actor';
  }

  act() {
  
  }

  isIntersect(actor) {
    if(!(actor instanceof Actor)) {
      throw new Error('Некорректные аргументы.');
    }
   
    if(this === actor) {
      return false;
    }

    return this.right > actor.left && this.left < actor.right && 
           this.bottom > actor.top && this.top < actor.bottom;
  }
}

class Level {
  constructor(grid = [], actors = []) {
    this.grid = grid.slice();
    this.actors = actors.slice();
    this.player = this.actors.find(actor => actor.type === 'player');
    this.height = this.grid.length;
    this.width = this.grid.reduce((width, cols) => width < cols.length ? cols.length : width, 0);

    this.status = null;
    this.finishDelay = 1;
  }

  isFinished() {
    return this.status != null && this.finishDelay < 0;
  }

  actorAt(actor) {
    if(!(actor instanceof Actor)) {
      throw new Error('Некорректные аргументы.');
    }

    return this.actors.find(currentActor => currentActor.isIntersect(actor));
  }

  obstacleAt(pos, size) {
    if(!(pos instanceof Vector) || !(size instanceof Vector)) {
      throw new Error('Некорректные аргументы.');
    }

    if(pos.x < 0 || pos.y < 0 || pos.x + size.x > this.width) {
      return 'wall';
    }
    if(pos.y + size.y > this.height) {
      return 'lava';
    }

    /*
		Я делаю проход по всем клеткам на которых находится объект и сразу же их проверяю.
		(округление вначале нужно для того, чтобы проверить все клетки которые задевает объект)
		тем самым я определяю все клетки на которых находится объект и проверяю их на наличие препятствий.
    */
    // да, всё правильно, в прошлый раз было менее понятно
    // тут лучше посчитать границы по x и y, сохранить их в переменные
    // и дальше с ними работать. Так не нужно будет округлять на каждой итерации
    // и переменные можно использовать в проверках выше.
    for (let cellY = Math.floor(pos.y); cellY < pos.y + size.y; cellY++) {
      for (let cellX = Math.floor(pos.x); cellX < pos.x + size.x; cellX++) {
        const gridItem = this.grid[cellY][cellX];
        if(gridItem) {
          return gridItem;
        }
      }
    }
  }

  removeActor(actor) {
    if(!(actor instanceof Actor)) {
      throw new Error('Некорректные аргументы.');
    }

    // если объект не будет найтен, то метод отработает некорректно
    const removeIndex = this.actors.indexOf(actor);
    this.actors.splice(removeIndex, 1);
  }

  noMoreActors(actorType) {
    // внешние скобки можно опустить
    return !(this.actors.some(currentActor => currentActor.type === actorType)
    );
  }

  playerTouched(actorType, actor) {
    if(this.status != null) {
      return;
    }

    if(actorType === 'lava' || actorType === 'fireball') {
      this.status = 'lost';
      return;
    }

    if(actorType === 'coin' && actor.type === 'coin') {
      this.removeActor(actor);
      if( this.noMoreActors('coin')) {
        this.status = 'won';
      }
    }
  }
}

class LevelParser {
  constructor(dictionary = {}) {
    this.dictionary = Object.assign({}, dictionary);
  }

  actorFromSymbol(sym) {
    return this.dictionary[sym];
  }

  obstacleFromSymbol(sym) {
    switch(sym) {
      case 'x':
        return 'wall';
      case '!':
        return 'lava';
    }
  }

  createGrid(grid) {
    return grid.map(row => {
      // почему бы не использовать mep ещё раз?
      // потому что row это string
      // строку можно преобразовать в массив, тогда код будет намного короче
      // с другой стороны, если не преобразоывать, то можно сэкономить
      // память, так что на ваше усмотрение

      // значение присваивается переменной один раз,
      // так что лучше использовать const
      let rowGrid = [];
      for(let i = 0; i < row.length; i++) {
        // gridItem
        const geidItem = this.obstacleFromSymbol(row[i]);
        rowGrid.push(geidItem);
      }
      return rowGrid;
    });
  }

  createActors(grid) {
    // const
    let actors = [];
    // можно использовать reduce и обойтись без переменной actors
    grid.forEach((row, rowI) => {
      for(let i = 0; i < row.length; i++) {
        // форматирование
        const actorClass = this.actorFromSymbol( row[i] );
        if(typeof actorClass === 'function') {
          let actor = new actorClass(new Vector( i, rowI));
          if(actor instanceof Actor) {
            actors.push(actor);
          }
        }
      }
    });
    return actors;
  }

  parse(plan) {
    // форматирование
    return new Level(this.createGrid(plan), 
                      this.createActors(plan)
                    );
  }
}

class Player extends Actor {
  constructor(pos = new Vector()) {
    super(pos.plus (new Vector(0, -0.5)), new Vector(0.8, 1.5));
  }

  get type() {
    return 'player';
  }
}

class Fireball extends Actor {
  constructor(position = new Vector(0, 0), speed = new Vector(0, 0)) {
    super(position, new Vector(1, 1), speed);
  }

  get type() {
    return 'fireball';
  }

  getNextPosition(time = 1) {
    return this.speed.times(time).plus(this.pos);
  }

  handleObstacle() {
    this.speed = this.speed.times(-1);
  }

  act(time, level) {
    const pos = this.getNextPosition(time);

    if(level.obstacleAt(pos, this.size)) {
      this.handleObstacle();
    }
    else {
      this.pos = pos;
    }
  }
}

class HorizontalFireball extends Fireball {
  constructor(pos) {
    super(pos, new Vector(2, 0));
  }
}

class VerticalFireball extends Fireball {
  constructor(pos) {
    super(pos, new Vector(0, 2));
  }
}

class FireRain extends Fireball {
  constructor(pos) {
    super(pos, new Vector(0, 3));
    this.startPos = pos;
  }

  handleObstacle() {
    this.pos = this.startPos;
  }
}

class Coin extends Actor {
  constructor(pos = new Vector()) {
    const newPos = pos.plus(new Vector(0.2, 0.1));
    super(newPos, new Vector(0.6, 0.6));

    this.startPos = newPos;
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = Math.random() * 2 * Math.PI;
  }

  get type() {
    return 'coin';
  }

  updateSpring(time = 1) {
    this.spring += this.springSpeed * time;
  }

  getSpringVector() {
    return new Vector(0, Math.sin(this.spring) * this.springDist);
  }

  getNextPosition(time = 1) {
    this.updateSpring(time);
    return this.startPos.plus(this.getSpringVector());
  }

  act(time) {
    this.pos = this.getNextPosition(time);
  }
}

const promise = loadLevels();
// форматирование
// тут можно обойтись стрелочными функциями
promise.then(function(json) {
  const levels = JSON.parse(json);

  const actorDict = {
    '@': Player,
    'v': FireRain,
    '=': HorizontalFireball,
    'o': Coin
  };
  
  const parser = new LevelParser(actorDict);
  runGame(levels, parser, DOMDisplay)
    .then(() => alert('Вы выиграли приз!'));
}, 

  function() {
    console.warn('Ошибка загрузки уровней!');
});