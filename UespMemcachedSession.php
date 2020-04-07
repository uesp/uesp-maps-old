<?php
/*
 * A very basic class that lets code access MediaWiki's SESSION variables saved in UESP's memcached.
 * 
 */

require_once("/home/uesp/secrets/uespservers.secrets");


class UespMemcachedSession
{
	
		/* Should match the MediaWiki settings */
	protected $UESP_DBNAME = 'uesp_net_wiki5';
	protected $UESP_MEMCACHED_HOST = '10.12.222.22';
	protected $UESP_MEMCACHED_PORT = 11000;
	
	public static $MEMCACHE = null;
	
	public function __construct()
	{
		global $UESP_SERVER_MEMCACHED;
		
		$this->UESP_MEMCACHED_HOST = $UESP_SERVER_MEMCACHED;
	}
	
	static function install()
	{
		
		session_set_save_handler(
			array( __CLASS__, 'open' ),
			array( __CLASS__, 'close' ),
			array( __CLASS__, 'read' ),
			array( __CLASS__, 'write' ),
			array( __CLASS__, 'destroy' ),
			array( __CLASS__, 'gc' ) );
		
		register_shutdown_function( 'session_write_close' );
	}
	
	
	static function connect()
	{
		self::$MEMCACHE = new Memcache;
		self::$MEMCACHE->connect($this->UESP_MEMCACHED_HOST, $this->UESP_MEMCACHED_PORT);
	}
	
	
	static function getKey( /* ... */ )
	{
		$args = func_get_args();
		$key = $this->UESP_DBNAME . ':' . implode( ':', $args );
		$key = str_replace( ' ', '_', $key );
		return $key;
	}
	
	
	static function open( $save_path, $session_name )
	{
		return true;
	}
	
	
	static function close()
	{
		return true;
	}
	
	
	static function read( $id )
	{
		if (self::$MEMCACHE == null) self::connect();
		
		$key = self::getKey( 'session', $id );
		$data = self::$MEMCACHE->get($key);
		
		if ( $data === false ) return '';
		return $data;
	}
	
	static function write( $id, $data )
	{
		//Not implemented
		return false;
	}
	
	
	static function destroy( $id ) 
	{
		//Not implemented
		return true;
	}
	
	
	static function gc( $maxlifetime )
	{
		return true;
	}
	
};


