'use strict';

class Vector {
  constructor( x = 0, y = 0 ) {
    this.x = x;
    this.y = y;
  }

  plus(vector) {
    if( ! ( vector instanceof Vector ) ) {
      throw new Error( 'Можно прибавлять к вектору только вектор типа Vector' );
    }

    return new Vector( this.x + vector.x, this.y + vector.y );
  }

  times(mult) {
    return new Vector( this.x * mult, this.y * mult );
  }
}

class Actor {
  constructor( position = new Vector( 0, 0 ), size = new Vector( 1, 1 ), speed = new Vector( 0, 0 )) {
    if( ! ( position instanceof Vector ) || ! ( size instanceof Vector ) || ! ( speed instanceof Vector ) ) {
      throw new Error( 'Некорректные аргументы.' );
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
    return ( this.pos.x ) + this.size.x;
  }

  get bottom() {
    return ( this.pos.y ) + this.size.y;
  }

  get type() {
    return 'actor';
  }

  act() {
  
  }

  isIntersect(actor) {
    if( ! ( actor instanceof Actor ) ) {
      throw new Error( 'Некорректные аргументы.' );
    }
   
    if( this === actor ) {
      return false;
    }

    return ( ( this.right > actor.left ) && ( this.left < actor.right ) && 
             ( this.bottom > actor.top ) && ( this.top < actor.bottom )
           );
  }
}

class Level {
  constructor( grid = [], actors = [] ) {
    this.grid = grid.slice();
    this.actors = actors;
    this.player = this.actors.find( ( actor ) => actor.type === 'player' );
    this.height = this.grid.length;
    this.width = this.grid.reduce( function( width, cols ) {
      return width < cols.length ? cols.length : width;
      }, 0);

    this.status = null;
    this.finishDelay = 1;
  }

  isFinished() {
    return this.status != null && this.finishDelay < 0;
  }

  actorAt( actor ) {
    if( ! ( actor instanceof Actor ) ) {
      throw new Error( 'Некорректные аргументы.' );
    }

    return this.actors.find(function(currentActor) {
      return currentActor != undefined && currentActor.isIntersect( actor );
    });
  }

  obstacleAt(pos, size) {
    if( ! ( pos instanceof Vector ) || ! ( size instanceof Vector ) ) {
      throw new Error( 'Некорректные аргументы.' );
    }

    if( pos.x < 0 || pos.y < 0 || pos.x + size.x > this.width ) {
      return 'wall';
    }
    if( pos.y + size.y > this.height ) {
      return 'lava';
    }

    for ( let cellY = pos.y; cellY <= Math.ceil( pos.y + size.y ); cellY++) {
      if( cellY > this.height ) {
        continue;
      }

      for ( let cellX = pos.x; cellX <= Math.ceil( pos.x + size.x ); cellX++ ) {
        if( cellX > this.width ) {
          continue;
        }

        let gridItem = this.grid[ Math.floor( cellY ) ][ Math.floor( cellX ) ];
        if( gridItem ) {
          return gridItem;
        }
      }
    }
  }

  removeActor( actor ) {
    if( ! ( actor instanceof Actor ) ) {
      throw new Error( 'Некорректные аргументы.' );
    }

    this.actors.forEach( ( value, index ) => {
      if( value === actor ) {
        this.actors.splice( index, 1 );
      }
    });
  }

  noMoreActors( actorType ) {
    return ! (
      this.actors.some( ( currentActor ) => currentActor != undefined && currentActor.type === actorType )
    );
  }

  playerTouched( actorType, actor ) {
    if( this.status != null ) {
      return;
    }

    if( actorType === 'lava' || actorType === 'fireball' ) {
      this.status = 'lost';
      return;
    }

    if( actorType === 'coin' && actor.type === 'coin' ) {
      this.removeActor( actor );
      if( this.noMoreActors( 'coin' ) ) {
        this.status = 'won';
      }
    }
  }
}

class LevelParser {
  constructor( dictionary = [] ) {
    this.dictionary = dictionary;
  }

  actorFromSymbol( sym ) {
    return this.dictionary[sym];
  }

  obstacleFromSymbol( sym ) {
    switch( sym ) {
      case 'x':
        return 'wall';
      case '!':
        return 'lava';
    }
  }

  createGrid( grid ) {
    return grid.map( ( row ) => {
      let rowGrid = [];
      for(let i = 0; i < row.length; i++) {
        rowGrid.push( this.obstacleFromSymbol( row[i] ) );
      }
      return rowGrid;
    });
  }

  createActors( grid ) {
    let actors = [];
    grid.forEach( ( row, rowI ) => {
      for( let i = 0; i < row.length; i++ ) {
        const actorClass = this.actorFromSymbol( row[i] );
        if( typeof actorClass == 'function' ) {
          let actor = new actorClass( new Vector( i, rowI ) );
          if( actor instanceof Actor ) {
            actors.push( actor );
          }
        }
      }
    });
    return actors;
  }

  parse( plan ) {
    return new Level( this.createGrid( plan ), 
                      this.createActors( plan )
                    );
  }
}

class Player extends Actor {
  constructor( pos = new Vector() ) {
    super( pos.plus ( new Vector( 0, -0.5 ) ), new Vector( 0.8, 1.5 ) );
  }

  get type() {
    return 'player';
  }
}

class Fireball extends Actor {
  constructor( position = new Vector( 0, 0 ), speed = new Vector( 0, 0 ) ) {
    super(position, new Vector( 1, 1 ), speed);
  }

  get type() {
    return 'fireball';
  }

  getNextPosition( time = 1 ) {
    return this.speed.times( time ).plus( this.pos );
  }

  handleObstacle() {
    this.speed = this.speed.times( - 1 );
  }

  act( time, level ) {
    const pos = this.getNextPosition( time );

    if( level.obstacleAt( pos, this.size ) ) {
      this.handleObstacle();
    }
    else {
      this.pos = pos;
    }
  }
}

class HorizontalFireball extends Fireball {
  constructor( pos ) {
    super(pos, new Vector( 2, 0 ) );
  }
}

class VerticalFireball extends Fireball {
  constructor( pos ) {
    super(pos, new Vector( 0, 2 ));
  }
}

class FireRain extends Fireball {
  constructor( pos ) {
    super( pos, new Vector( 0, 3 ));
    this.startPos = pos;
  }

  handleObstacle() {
    this.pos = this.startPos;
  }
}

class Coin extends Actor {
  constructor( pos = new Vector() ) {
    const newPos = pos.plus( new Vector( 0.2, 0.1 ) );
    super( newPos, new Vector( 0.6, 0.6 ));

    this.startPos = newPos;
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = Math.random() * ( 2 * Math.PI );
  }

  get type() {
    return 'coin';
  }

  updateSpring( time = 1 ) {
    this.spring += this.springSpeed * time;
  }

  getSpringVector() {
    return new Vector( 0, Math.sin( this.spring ) * this.springDist );
  }

  getNextPosition( time = 1 ) {
    this.updateSpring( time );
    return this.startPos.plus( this.getSpringVector() );
  }

  act( time ) {
    this.pos = this.getNextPosition( time );
  }
}

let promise = loadLevels();
promise.then( function( json ) {
  let levels = JSON.parse( json );

  const actorDict = {
    '@': Player,
    'v': FireRain,
    '=': HorizontalFireball,
    'o': Coin
  };
  const parser = new LevelParser( actorDict );
  runGame( levels, parser, DOMDisplay )
    .then( () => alert( 'Вы выиграли приз!' ) );
}, function() {
  alert( 'Ошибка загрузки уровней!' );
});