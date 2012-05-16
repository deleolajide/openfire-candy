/*

	Milenia Grafter Server

	Copyright (c) 2007-2008 by Milan Toth. All rights reserved.

	This program is free software; you can redistribute it and/or
	modify it under the terms of the GNU General Public License
	as published by the Free Software Foundation; either version 2
	of the License, or (at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program; if not, write to the Free Software
	Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.

*/

package com.milgra.server;

/**

	Server class

	@mail milgra@milgra.com
	@author Milan Toth
	@version 20080316

	Tasks of Server

		- process command line parameters
		- create a new instance if needed
		- init closing on an old instance if needed
		- initialize containers
		- load and initialize custom applications
		- register applications
		- register processes
		- register clients
		- register streams

**/

import java.io.File;
import java.io.IOException;
import java.io.OutputStream;

import java.net.URL;
import java.net.Socket;
import java.net.URLClassLoader;

import java.util.List;
import java.util.Arrays;
import java.util.HashMap;
import java.util.ArrayList;

import com.milgra.server.api.Client;
import com.milgra.server.api.IApplication;


public class Server
{

	public static SocketConnector socketConnector;

	// players - stream players
	// routers - stream routers

	public static ArrayList < OStream > players;
	public static ArrayList < OStream > routers;

	// states - container for application states
	// pools - container for process groups
	// clients - container for clients

	public static HashMap < String , Boolean > states;
	public static HashMap < String , ProcessGroup > pools;
	public static HashMap < String , ArrayList < Client > > clients;

	/**
	 * Server constructor
	 **/

	public Server (String rtmpPort )
	{
		if (rtmpPort != null)
		{
			Library.PORT = Integer.parseInt( rtmpPort);
		}

		System.out.println( System.currentTimeMillis() + " Server.construct ");

		// construct

		players = new ArrayList < OStream > ( );
		routers = new ArrayList < OStream > ( );

		pools = new HashMap < String , ProcessGroup > ( );
		states = new HashMap < String , Boolean > ( );
		clients = new HashMap < String , ArrayList < Client > > ( );

		// register socket connector

		socketConnector = new SocketConnector( );
		registerProcess( socketConnector , "sockets" );

	}



	/**
	 * Adds process to process group
	 * @param processX process
	 * @param groupX process group identifier
	 **/

	public static void registerProcess ( OProcess processX , String groupX )
	{

		System.out.println( System.currentTimeMillis() + " Server.registerProcess " + processX + " " + groupX );

		if ( !pools.containsKey( groupX ) )	pools.put( groupX , new ProcessGroup( groupX ) );
		pools.get( groupX ).addProcess( processX );

	}

	/**
	 * Removes process from process group
	 * @param processX process
	 * @param groupX process group identifier
	 **/

	public static void unregisterProcess ( OProcess processX , String groupX )
	{

		System.out.println( System.currentTimeMillis() + " Server.unregisterProcess " + processX + " " + groupX );

		if ( !pools.containsKey( groupX ) ) return;
		pools.get( groupX ).removeProcess( processX );

	}


	/**
	 * Registers a stream router
	 * @param nameX stream name
	 * @param routerX router instance
	 **/

	public static void registerRouter ( OStream routerX )
	{

		System.out.println( System.currentTimeMillis() + " Server.registerRouter " + routerX );
		synchronized ( routers ) { routers.add( routerX ); }

	}

	/**
	 * Unregisters a stream router
	 * @param nameX stream name
	 * @param routerX router instance
	 **/

	public static void unregisterRouter ( OStream routerX )
	{

		System.out.println( System.currentTimeMillis( ) + " Server.unregisterRouter " + routerX );
		synchronized ( routers ) { routers.remove( routerX ); }

	}

	/**
	 * Registers a stream player
	 * @param playerX player instance
	 **/

	public static void registerPlayer ( OStream playerX )
	{

		System.out.println( System.currentTimeMillis( ) + " Server.registerPlayer " + playerX );
		synchronized ( players ) { players.add( playerX ); }

	}

	/**
	 * Unregisters a stream player
	 * @param playerX player istance
	 **/

	public static void unregisterPlayer ( OStream playerX )
	{

		System.out.println( System.currentTimeMillis() + " Server.unregisterPlayer " + playerX );
		synchronized ( players ) { players.remove( playerX ); }

	}

	/**
	 * Subscribes player to available router
	 * @param playerX player instance
	 * @param nameX stream name
	 **/

	public static void connectPlayer ( OStream playerX , String nameX )
	{

		System.out.println( System.currentTimeMillis() + " Server.connectPlayer " + playerX + " " + nameX );

		synchronized ( routers )
		{

			// search for router

			for ( OStream router : routers )
				if ( router.getName( ).equals( nameX ) ) router.subscribe( playerX );

		}

	}

	/**
	 * UNSubscribes player from available router
	 * @param playerX player instance
	 * @param nameX stream name
	 **/

	public static void disconnectPlayer ( OStream playerX , String nameX )
	{

		System.out.println( System.currentTimeMillis() + " Server.connectPlayer " + playerX + " " + nameX );

		synchronized ( routers )
		{

			// search for router

			for ( OStream router : routers )
				if ( router.getName( ).equals( nameX ) ) router.unsubscribe( playerX );

		}

	}

	/**
	 * Subscribe players to router
	 * @param playerX player instance
	 * @param nameX stream name
	 */

	public static void connectRouter ( OStream routerX , String nameX )
	{

		System.out.println( System.currentTimeMillis() + " Server.connectRouter " + routerX + " " + nameX );

		synchronized ( players )
		{

			// search for players

			for ( OStream player : players )
				if ( player.getName( ).equals( nameX ) ) routerX.subscribe( player );

		}

	}

	/**
	 * Subscribe players to router
	 * @param playerX player instance
	 * @param nameX stream name
	 */

	public static void disconnectRouter ( OStream routerX , String nameX )
	{

		System.out.println( System.currentTimeMillis() + " Server.connectRouter " + routerX + " " + nameX );

		synchronized ( players )
		{

			// search for players

			for ( OStream player : players )
				if ( player.getName( ).equals( nameX ) ) routerX.unsubscribe( player );

		}
	}

	/**
	 * Returns stream router names
	 * @return copy of actual stream router names
	 **/

	public static ArrayList < String > getStreamNames ( )
	{

		System.out.println( System.currentTimeMillis() + " Server.getStreamRouters" );

		ArrayList < String > names = new ArrayList < String > ( );
		for ( OStream router : routers ) names.add( router.getName( ) );

		return names;

	}

	/**
	 * Creates a new Server instance
	 * @param args command line arguments
	 **/

	/**
	 * Shuts down server instance
	 **/

	public static void shutdown ( )
	{

		System.out.println( System.currentTimeMillis( ) + " Server.shutdown" );

		// stop listening to new connections

		unregisterProcess( socketConnector , "sockets" );

		// close process groups

		for ( ProcessGroup pool : pools.values( ) ) pool.close( );

	}

	/**
	 * Attempts to close a Milenia instance attached to a specific port
	 * Creates a temporary file, then sends a zero byte to the selected port. The decoder
	 * recognizes the attempt, since an rtmp handshake should start with 0x03
	 **/

	public static void closeRequest ( )
	{

		System.out.println( System.currentTimeMillis( ) + " Server.closeRequest" );

		try
		{

			// create temporary file and socket

			File trigger = new File( Library.CLOSEFILE );
			Socket socket = new Socket( "localhost" , Library.PORT );
			OutputStream stream = socket.getOutputStream( );

			// trigger

			trigger.createNewFile( );
			stream.write( 0 );

			// cleanup

			stream.close( );
			socket.close( );

		}
		catch ( IOException exception )	{ System.out.println( Library.NOPORT ); }

	}

	/**
	 * Checks if shutdown request is valid by checking the existence of the temporary file
	 **/

	public static void shutdownCheck ( )
	{

		System.out.println( System.currentTimeMillis( ) + " Server.shutCheck" );

		File trigger = new File( Library.CLOSEFILE );
		if ( trigger.exists( ) ) { trigger.delete( ); shutdown( ); }

	}

}
