'use strict';
class Vector 
{
  constructor(x, y)
  {
    this.x = x;
    this.y = y;
  }

  plus(vector)
  {
    if( !( vector instanceof Vector ) )
    {
      throw "Можно прибавлять к вектору только вектор типа Vector";
    }

    return new Vector(this.x + vector.x, this.y + vector.y);
  }

  times(mult)
  {
    return new Vector(this.x * mult, this.y * mult);
  }
}

class Actor
{
  constructor(position = new Vector(0,0), size = new Vector(1,1), speed = new Vector(0,0))
  {
    if( !( position instanceof Vector ) || !( size instanceof Vector ) || !( speed instanceof Vector ) )
    {
      throw "Некорректные аргументы.";
    }

    this.pos = position;
    this.size = size;
    this.speed = speed;
  }

  get left()
  {
    return Math.round(this.pos.x);
  }
  get top()
  {
    return Math.round(this.pos.y);
  }
  get right()
  {
    return Math.round(this.pos.x) + this.size.x;
  }
  get bottom()
  {
    return Math.round(this.pos.y) + this.size.y;
  }

  get type()
  {
    return 'actor';
  }

  act()
  {

  }

  isIntersect(actor)
  {
    if( ! ( actor instanceof Actor ) )
    {
      throw "Некорректные аргументы.";
    }

    if( this === actor )
    {
      return false;
    }

    let XColl=false;
    let YColl=false;

    if ((this.right > actor.left) && (this.left < actor.right)) 
      XColl = true;
    if ((this.bottom > actor.top) && (this.top < actor.bottom)) YColl = true;

    if (XColl&YColl)
    {
      return true;
    }
    return false;
  }
}

class Level
{
  constructor(grid = [], actors = [])
  {
    this.grid = grid;
    this.actors = actors;

    this.player = undefined;

    this.height = this.grid.length;
    let width = 0;
    this.grid.forEach(function(cols){
      if( width < cols.length )
      {
        width = cols.length;
      }
    });
    this.width = width;

    this.status = null;
    this.finishDelay = 1;
  }

  isFinished()
  {
    return this.status != null && this.finishDelay < 0;
  }

  actorAt(actor)
  {
    if( ! ( actor instanceof Actor ) )
    {
      throw "Некорректные аргументы.";
    }

    for( let actor_ of this.actors )
    {
      if( actor_ != undefined && actor_.isIntersect(actor) )
      {
        return actor_;
      }
    }

    return undefined;
  }

  obstacleAt(pos, size)
  {
    if( ! ( pos instanceof Vector ) || ! ( size instanceof Vector ) )
    {
      throw "Некорректные аргументы.";
    }

    for(let y = 0; y < size.y; y++)
    {
      for(let x = 0; x < size.x; x++)
      {
        let y_ = Math.floor(pos.y + y);
        let x_ = Math.floor(pos.x + x);
        if( x_ < 0 ) x_ = 0;
        if( y_ < 0 ) y_ = 0;
        if( x_ > this.width ) x_ = this.width;
        if( y_ > this.width ) y_ = this.height;

        if( y_ >= 0 && x_ >= 0 && y_ < this.height && x_ < this.width )
        {
          let blockLeft = undefined;
          let blockRight = undefined;
          if( this.grid[y_][x_] != undefined )
          {
            blockLeft = this.grid[y_][x_];
          }
          x_ = Math.ceil(pos.x + x - 1 + size.x);
          if( x_ < this.width && this.grid[y_][x_] != undefined )
          {
            blockRight = this.grid[y_][x_];
          }

          if( blockLeft == 'lava' || blockRight == 'lava' )
          {
            return 'lava';
          }
          if( blockRight == 'wall' || blockLeft == 'wall' )
          {
            return 'wall';
          }
        }
      }
    }

    let actor = new Actor(pos, size);
    if( actor.left < 0 || actor.top < 0 || actor.right > this.width )
    {
      return 'wall';
    }
    else if( actor.bottom > this.height )
    {
      return 'lava';
    }

    return undefined;
  }

  removeActor(actor)
  {
    if( ! ( actor instanceof Actor ) )
    {
      throw "Некорректные аргументы.";
    }

    console.log("removeActor(actor)")

    let self = this;
    this.actors.forEach(function(value, index){
      if( value == actor )
      {
        delete self.actors[index];
      }
    });
  }

  noMoreActors(actorType)
  {
    let isNoMore = true;

    for(let actor_ of this.actors)
    {
      if( actor_ != undefined && actor_.type == actorType )
      {
        isNoMore = false;
      } 
    }

    return isNoMore;
  }

  playerTouched(actorType, actor)
  {
    if( this.status != null )
    {
      return;
    }

    if( actorType == 'lava' || actorType == 'fireball' )
    {
      this.status = 'lost';
      console.log("USER LOST");
      return;
    }

    if( actorType == 'coin' && actor.type == 'coin' )
    {
      this.removeActor(actor);
      if( this.noMoreActors('coin') )
      {
        this.status = 'won';
        return;
      }
    }
  }
}

class LevelParser
{
  constructor(wordbook)
  {
    this.wordbook = wordbook;
  }

  actorFromSymbol(sym)
  {
    for(let key in this.wordbook)
    {
      if(key == sym)
      {
        return this.wordbook[key];
      }
    }

    return undefined;
  }

  obstacleFromSymbol(sym)
  {
    let res = undefined;
    switch(sym)
    {
      case 'x':
        res = 'wall';
        break;
      case '!':
        res = 'lava';
        break;
    }
    return res;
  }

  createGrid(grid)
  {
    let res = new Array();
    let self = this;
    grid.forEach(function(row, rowI){
      res.push( new Array() );
      for( let i = 0; i < row.length; i++ )
      {
        res[rowI].push(self.obstacleFromSymbol(row[i]));
      }
    });
    return res;
  }

  createActors(grid)
  {
    let actors = new Array();
    let self = this;
    console.log("createActors-start");
    grid.forEach(function(row, rowI){
      for( let i = 0; i < row.length; i++ )
      {
        let actor = self.actorFromSymbol(row[i]);
        if( actor != undefined && new actor(new Vector(0,0)) instanceof Actor )
        {
          let act = new actor(new Vector(i, rowI));
          actors.push(act);
        }
      }
    });
    console.log("createActors-end");
    return actors;
  }

  parse(plan)
  {
    return new Level( this.createGrid(plan), 
                      this.createActors(plan)
                    );
  }
}

class Player extends Actor
{
  constructor(pos = new Vector())
  {
    super(pos.plus( new Vector(0, -0.5) ), new Vector(0.8, 1.5));
  }

  get type()
  {
    return 'player';
  }
}

class Fireball extends Actor
{
  constructor(position = new Vector(0,0), speed = new Vector(0,0))
  {
    super(position, new Vector(1,1), speed);
  }

  get type()
  {
    return "fireball";
  }

  getNextPosition(time = 1)
  {
    return new Vector( this.pos.x + this.speed.x * time, this.pos.y + this.speed.y * time );
  }

  handleObstacle()
  {
    this.speed = new Vector( 0 - this.speed.x, 0 - this.speed.y );
  }

  act(time, level)
  {
    if( ! ( level instanceof Level ) )
    {
      throw "Некорректные аргументы.";
    }

    let pos = this.getNextPosition(time);

    if( level.obstacleAt(pos, this.size) == undefined )
    {
      this.pos = pos;
    }
    else
    {
      this.handleObstacle();
    }
  }
}

class HorizontalFireball extends Fireball
{
  constructor(pos)
  {
    super(pos, new Vector(2, 0));
  }
}

class VerticalFireball extends Fireball
{
  constructor(pos)
  {
    super(pos, new Vector(0, 2));
  }
}

class FireRain extends VerticalFireball
{
  constructor(pos)
  {
    super(pos);

    this.speed.y = 3;
    this.startPos = pos;
  }

  handleObstacle()
  {
    this.pos = this.startPos;
  }
}

class Coin extends Actor
{
  constructor(pos)
  {
    console.log("==========================");
    console.log(pos);
    console.log("==========================");
    let newPos = pos.plus( new Vector(-0.2, -0.1) );
    super(newPos, new Vector(0.6, 0.6));

    this.startPos = newPos;
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = Math.random() * ( 2 * Math.PI );
  }

  get type()
  {
    return "coin";
  }

  updateSpring(time = 1)
  {
    this.spring += this.springSpeed * time;
  }

  getSpringVector()
  {
    return new Vector(0, Math.sin( this.spring * ( this.size.y / 2 ) ));
  }

  getNextPosition(time = 1)
  {
    this.updateSpring(time);
    return this.startPos.plus(this.getSpringVector());
  }

  act(time)
  {
    this.pos = this.getNextPosition(time);
  }
}

// loadLevels делает загрузку с файла с некорректными заголовками
// Failed to load https://neto-api.herokuapp.com/js/diplom/levels.json: No 'Access-Control-Allow-Origin' header is present on the requested resource. Origin 'http://js-final.net' is therefore not allowed access.

let promise = loadLevels();
promise.then(function(json){
  let levels = JSON.parse(json);
  console.log(levels);
}, function(){
  alert("Ошибка загрузки уровней!");
});

const schemas = [
  [
    '         ',
    '       xx',
    '         ',
    '       o ',
    '     !xxx',
    ' @o      ',
    'xxx!     ',
    '         '
  ],
  [
    '  v   v  ',
    '         ',
    '         ',
    '        o',
    '        x',
    '@   x    ',
    'x        ',
    '         '
  ]
];
const actorDict = {
  '@': Player,
  'v': FireRain,
  '=': HorizontalFireball,
  'o': Coin
}
const parser = new LevelParser(actorDict);
runGame(schemas, parser, DOMDisplay)
  .then(() => console.log('Вы выиграли приз!'));
