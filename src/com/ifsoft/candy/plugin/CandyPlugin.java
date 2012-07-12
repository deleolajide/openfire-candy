package com.ifsoft.candy.plugin;

import org.jivesoftware.openfire.SessionManager;
import org.jivesoftware.openfire.container.Plugin;
import org.jivesoftware.openfire.container.PluginManager;
import org.jivesoftware.util.*;
import org.jivesoftware.openfire.http.HttpBindManager;
import org.jivesoftware.openfire.session.LocalClientSession;

import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.ConcurrentHashMap;
import java.io.File;
import java.net.InetSocketAddress;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.xmpp.component.Component;
import org.xmpp.component.ComponentException;
import org.xmpp.component.ComponentManager;
import org.xmpp.component.ComponentManagerFactory;

import org.eclipse.jetty.server.handler.ContextHandlerCollection;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;
import org.eclipse.jetty.webapp.WebAppContext;
import org.eclipse.jetty.websocket.WebSocket;

import com.ifsoft.candy.servlet.XMPPServlet;

import org.xmpp.packet.JID;

import org.red5.server.webapp.voicebridge.Application;

import com.ifsoft.cti.OpenlinkComponent;

import com.milgra.server.Server;


public class CandyPlugin implements Plugin {

	private static Logger Log = LoggerFactory.getLogger( "CandyPlugin" );

	private static final String NAME 		= "candy";
	private static final String DESCRIPTION = "Candy Plugin for Openfire";

    private Application application;
    private OpenlinkComponent component;
    private ConcurrentHashMap<String, WebSocket> sockets = new ConcurrentHashMap<String, WebSocket>();



	public void initializePlugin(PluginManager manager, File pluginDirectory)
	{
		Log.info( "candy plugin : initializePlugin");

		String appName = JiveGlobals.getProperty("candy.webapp.name", "candy");

		// create the context for candy
        try {
			ContextHandlerCollection contexts = HttpBindManager.getInstance().getContexts();
			try {

				if ("websockets".equals(JiveGlobals.getProperty("candy.webapp.connection", "bosh")))
				{
					Log.info( "candy plugin : initialize Websockets " + appName);

					ServletContextHandler context = new ServletContextHandler(contexts, "/" + appName, ServletContextHandler.SESSIONS);
					context.addServlet(new ServletHolder(new XMPPServlet()),"/server");
				}

				Log.info( "candy plugin : initialize Web app " + appName);

				WebAppContext context2 = new WebAppContext(contexts, pluginDirectory.getPath(), "/" + appName);
				context2.setWelcomeFiles(new String[]{"index.html"});

				Log.info("candy plugin : starting Openlink Component");
				component = new OpenlinkComponent(this);
				component.componentEnable();

				Log.info("candy plugin : starting VOIP Server");
				application = new Application();
				application.appStart(component);
				component.setApplication(application);

				Log.info("candy plugin : starting RTMP Server");
				new Server(JiveGlobals.getProperty("voicebridge.rtmp.port", "1935"));

			}
			catch(Exception e) {
				Log.error( "An error has occurred", e );
				return;
        	}
		}
		catch (Exception e) {
			Log.error("Error initializing Candy Plugin", e);
			return;
		}
	}

	public void destroyPlugin()
	{
		Log.info( "candy plugin : destroyPlugin");
		Iterator it = sockets.entrySet().iterator();
		while ( it.hasNext() ) {
			try {
				LocalClientSession session = ( LocalClientSession ) it.next();

				if (session instanceof LocalClientSession)
				{
					SessionManager.getInstance().removeSession( session );
				}
				session = null;

			} catch ( Exception e ) {
				Log.error( "An error occurred while attempting to clear a session while destroying the candy plugin", e );
			}
		}

		sockets.clear();
		try {
			/*
			context.stop();
			while ( context.isStopping() ) {
				Thread.sleep( 500 );
			}
			*/
			// context.destroy();
		} catch ( Exception e ) {
			Log.error( "An error occurred while attempting to destroy the context", e );
		}
		// context = null;

		Log.info("candy plugin : stopping VOIP Server");
		application.appStop();

		Log.info("candy plugin : stopping Openlink Component");
		component.componentDestroyed();

		Log.info("candy plugin : stopping RTMP Server");
		Server.closeRequest();
	}

	public String getName()
	{
		 return NAME;
	}

	public String getDescription()
	{
		return DESCRIPTION;
	}

	public int getCount() {
		return this.sockets.size();
	}

	public ConcurrentHashMap<String, WebSocket> getSockets() {
		return sockets;
	}
}