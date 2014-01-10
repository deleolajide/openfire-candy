package com.ifsoft.candy.plugin;

import org.jivesoftware.openfire.container.Plugin;
import org.jivesoftware.openfire.container.PluginManager;
import org.jivesoftware.util.*;
import org.jivesoftware.openfire.http.HttpBindManager;

import java.util.*;
import java.io.File;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.eclipse.jetty.server.handler.ContextHandlerCollection;
import org.eclipse.jetty.webapp.WebAppContext;

import org.xmpp.packet.JID;



public class CandyPlugin implements Plugin {

	private static Logger Log = LoggerFactory.getLogger( "CandyPlugin" );

	private static final String NAME 		= "candy";
	private static final String DESCRIPTION = "Candy Plugin for Openfire";

	public void initializePlugin(PluginManager manager, File pluginDirectory)
	{
		Log.info( "candy plugin : initializePlugin");

		String appName = JiveGlobals.getProperty("candy.webapp.name", "candy");

		ContextHandlerCollection contexts = HttpBindManager.getInstance().getContexts();
		try {
			Log.info( "candy plugin : initialize Web app " + appName);

			WebAppContext context2 = new WebAppContext(contexts, pluginDirectory.getPath(), "/" + appName);
			context2.setWelcomeFiles(new String[]{"index.html"});

		}
		catch(Exception e) {
			Log.error( "An error has occurred", e );
			return;
		}
	}

	public void destroyPlugin()
	{
		Log.info( "candy plugin : destroyPlugin");
	}

	public String getName()
	{
		 return NAME;
	}

	public String getDescription()
	{
		return DESCRIPTION;
	}
}