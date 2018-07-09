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
    // check type

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
    // check type

    this.pos = position;
    this.size = size;
    this.speed = speed;
  }

  get left()
  {
    return this.pos.x;
  }
  get top()
  {
    return this.pos.y;
  }
  get right()
  {
    return this.pos.x + this.size.x;
  }
  get bottom()
  {
    return this.pos.y + this.size.y;
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
    // check type

    if( this === actor )
    {
      return false;
    }

    let XColl=false;
    let YColl=false;

    if ((this.right >= actor.left) && (this.left <= actor.right)) 
      XColl = true;
    if ((this.bottom >= actor.top) && (this.top <= actor.bottom)) YColl = true;

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
    // check type

    for(let y = 0; y < actor.size.y; y++)
    {
      for(let x = 0; x < actor.size.x; x++)
      {
        // !!!!!!!!!!!!!!!!! какой объект возвращать? !!!!!!!!!!!!!!!!!
        let y_ = Math.ceil(actor.pos.y + y);
        let x_ = Math.ceil(actor.pos.x + x);
        if( this.grid[y_][x_] != undefined )
          return new Actor();
      }
    }

    return undefined;
  }

  obstacleAt(pos, size)
  {
    // check type

    for(let y = 0; y < size.y; y++)
    {
      for(let x = 0; x < size.x; x++)
      {
        let y_ = Math.ceil(pos.y + y);
        let x_ = Math.ceil(pos.x + x);
        if( this.grid[y_][x_] != undefined )
          return this.grid[y_][x_];
      }
    }

    let actor = new Actor(pos, size);
    if( actor.left < 0 || actor.top > this.height || actor.right > this.width )
    {
      return 'wall';
    }
    else if( actor.bottom < 0 )
    {
      return 'lava';
    }

    return undefined;
  }

  removeActor(actor)
  {
    // check type

    for(let y = 0; y < actor.size.y; y++)
    {
      for(let x = 0; x < actor.size.x; x++)
      {
        if( this.grid[actor.pos.y + y][actor.pos.x + x] != undefined && this.grid[actor.pos.y + y][actor.pos.x + x] == actor.type )
        {
          this.grid[actor.pos.y + y][actor.pos.x + x] = undefined;
        }
      }
    }
  }

  noMoreActors(actorType)
  {
    let isNoMore = true;

    this.grid.forEach(function(cols){
      cols.forEach(function(actor){
        if( actor == actorType )
        {
          isNoMore = false;
        }
      });
    });

    return isNoMore;
  }

  playerTouched(actorType, actor)
  {
    if( this.status == null )
    {
      return;
    }

    if( actorType == 'lava' || actorType == 'fireball' )
    {
      this.status = 'lost';
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
    grid.forEach(function(row, rowI){
      for( let i = 0; i < row.length; i++ )
      {
        let actor = self.actorFromSymbol(row[i]);
        if( actor != undefined && new actor() instanceof Actor )
        {
          actors.push(new actor(new Vector(i, rowI)));
        }
      }
    });
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

const schema = [
  '         ',
  '         ',
  '         ',
  '         ',
  '     !xxx',
  ' @       ',
  'xxx!     ',
  '         '
];
const actorDict = {
  '@': Player
}
const parser = new LevelParser(actorDict);
const level = parser.parse(schema);
runLevel(level, DOMDisplay);
