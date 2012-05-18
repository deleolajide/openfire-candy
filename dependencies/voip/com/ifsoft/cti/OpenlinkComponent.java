package com.ifsoft.cti;

import java.io.*;
import java.net.*;
import java.util.*;

import org.dom4j.Document;
import org.dom4j.DocumentHelper;
import org.dom4j.Element;

import org.jivesoftware.openfire.container.Plugin;
import org.jivesoftware.openfire.http.HttpBindManager;
import org.jivesoftware.openfire.session.Session;
import org.jivesoftware.openfire.RoutingTable;
import org.jivesoftware.openfire.XMPPServer;
import org.jivesoftware.openfire.PrivateStorage;

import org.jivesoftware.util.Log;
import org.jivesoftware.openfire.cluster.ClusterManager;
import org.jivesoftware.util.JiveGlobals;

import org.xmpp.component.Component;
import org.xmpp.component.AbstractComponent;
import org.xmpp.component.ComponentException;
import org.xmpp.component.ComponentManager;
import org.xmpp.component.ComponentManagerFactory;

import org.xmpp.packet.IQ;
import org.xmpp.packet.JID;
import org.xmpp.packet.Message;
import org.xmpp.packet.Packet;

import org.apache.log4j.Logger;

import org.red5.server.webapp.voicebridge.Application;

public class OpenlinkComponent extends AbstractComponent {

	private ComponentManager componentManager;
	private JID componentJID = null;
	public Plugin plugin;

	private PrivateStorage privateStorage;
	private OpenlinkCommandManager openlinkManger;
	private Application application;

    protected Logger Log = Logger.getLogger(getClass().getName());

//-------------------------------------------------------
//
//
//
//-------------------------------------------------------

	public OpenlinkComponent(Plugin plugin)
	{
        super(16, 1000, true);

		Log.info("OpenlinkComponent");

        this.plugin = plugin;
        this.componentJID = new JID(getName() + "." + getDomain());
	}

	public void componentEnable()
	{
		try {
			privateStorage 		= XMPPServer.getInstance().getPrivateStorage();
			componentManager 	= ComponentManagerFactory.getComponentManager();
			openlinkManger 		= new OpenlinkCommandManager();

			componentManager.addComponent(getName(), this);
			openlinkManger.addCommand(new ManageVoiceBridge(this));

		}
		catch(Exception e) {
			Log.error(e);
		}

    }


	public void componentDestroyed()
	{
		try {
			openlinkManger.stop();
			componentManager.removeComponent(getName());

		}
		catch(Exception e) {
			Log.error(e);
		}
	}

	public void setApplication(Application application)
	{
		this.application = application;
	}

//-------------------------------------------------------
//
//
//
//-------------------------------------------------------

	@Override public String getDescription()
	{
		return "Openlink Component";
	}


	@Override public String getName()
	{
		return "openlink";
	}

	@Override public String getDomain()
	{
		String hostName =  XMPPServer.getInstance().getServerInfo().getHostname();
		return JiveGlobals.getProperty("xmpp.domain", hostName);
	}

	@Override public void postComponentStart()
	{

	}

	@Override public void postComponentShutdown()
	{

	}

	public JID getComponentJID()
	{
		return new JID(getName() + "." + getDomain());
	}

//-------------------------------------------------------
//
//
//
//-------------------------------------------------------


    @Override protected void handleMessage(Message received)
    {
		Log.debug("handleMessage \n"+ received.toString());
    }

	@Override protected void handleIQResult(IQ iq)
	{
		Log.debug("handleIQResult \n"+ iq.toString());
	}

	@Override protected void handleIQError(IQ iq)
	{
		Log.debug("handleIQError \n"+ iq.toString());
	}

   @Override public IQ handleDiscoInfo(IQ iq)
    {
    	JID jid = iq.getFrom();
		Element child = iq.getChildElement();
		String node = child.attributeValue("node");

		IQ iq1 = IQ.createResultIQ(iq);
		iq1.setType(org.xmpp.packet.IQ.Type.result);
		iq1.setChildElement(iq.getChildElement().createCopy());

		Element queryElement = iq1.getChildElement();
		Element identity = queryElement.addElement("identity");

		queryElement.addElement("feature").addAttribute("var",NAMESPACE_DISCO_INFO);
		queryElement.addElement("feature").addAttribute("var",NAMESPACE_XMPP_PING);

		identity.addAttribute("category", "component");
		identity.addAttribute("name", "Openlink");

		if (node == null) 				// Disco discovery of openlink
		{
			identity.addAttribute("type", "command-list");
			queryElement.addElement("feature").addAttribute("var", "http://jabber.org/protocol/commands");
			queryElement.addElement("feature").addAttribute("var", "http://xmpp.org/protocol/openlink:01:00:00");


		} else {

			// Disco discovery of Openlink command

			OpenlinkCommand command = openlinkManger.getCommand(node);

			if (command != null && command.hasPermission(jid))
			{
				identity.addAttribute("type", "command-node");
				queryElement.addElement("feature").addAttribute("var", "http://jabber.org/protocol/commands");
				queryElement.addElement("feature").addAttribute("var", "http://xmpp.org/protocol/openlink:01:00:00");
			}

		}
		//Log.debug("handleDiscoInfo "+ iq1.toString());
		return iq1;
    }


   @Override public IQ handleDiscoItems(IQ iq)
    {
    	JID jid = iq.getFrom();
		Element child = iq.getChildElement();
		String node = child.attributeValue("node");

		IQ iq1 = IQ.createResultIQ(iq);
		iq1.setType(org.xmpp.packet.IQ.Type.result);
		iq1.setChildElement(iq.getChildElement().createCopy());

		Element queryElement = iq1.getChildElement();
		Element identity = queryElement.addElement("identity");

		identity.addAttribute("category", "component");
		identity.addAttribute("name", "openlink");
		identity.addAttribute("type", "command-list");

		if ("http://jabber.org/protocol/commands".equals(node))
		{
			for (OpenlinkCommand command : openlinkManger.getCommands())
			{
				// Only include commands that the sender can invoke (i.e. has enough permissions)

				if (command.hasPermission(jid))
				{
					Element item = queryElement.addElement("item");
					item.addAttribute("jid", componentJID.toString());
					item.addAttribute("node", command.getCode());
					item.addAttribute("name", command.getLabel());
				}
			}
		}
		//Log.debug("handleDiscoItems "+ iq1.toString());
		return iq1;
    }

   @Override public IQ handleIQGet(IQ iq)
    {
		return handleIQPacket(iq);
	}

   @Override public IQ handleIQSet(IQ iq)
    {
		return handleIQPacket(iq);
	}

   private IQ handleIQPacket(IQ iq)
    {
		Log.debug("handleIQPacket \n"+ iq.toString());

		Element element = iq.getChildElement();
		IQ iq1 = IQ.createResultIQ(iq);
		iq1.setType(org.xmpp.packet.IQ.Type.result);
		iq1.setChildElement(iq.getChildElement().createCopy());

		if (element != null)
		{
			String namespace = element.getNamespaceURI();

			if("http://jabber.org/protocol/commands".equals(namespace))
				iq1 = openlinkManger.process(iq);
		}
		return iq1;
	}


//-------------------------------------------------------
//
//
//
//-------------------------------------------------------


	public void sendPacket(Packet packet)
	{
		try {
			componentManager.sendPacket(this, packet);

		} catch (Exception e) {
			Log.error("Exception occured while sending packet." + e);

		}
	}

	public String manageVoiceBridge(Element newCommand, JID userJID, List<Object[]> actions)
	{
		Log.debug( "manageVoiceMessage " + userJID + " ");
		String errorMessage = "";
		List<String> actionList = new ArrayList<String>();

		try {

			if (application != null)
			{
				if (actions != null && actions.size() > 0)
				{
					Iterator it = actions.iterator();

					while( it.hasNext() )
					{
						Object[] action = (Object[])it.next();
						String name = (String) action[0];
						String value1 = (String) action[1];
						String value2 = (String) action[2];

						String thisErrorMessage = application.manageCallParticipant(userJID, value1, name, value2);

						if (thisErrorMessage == null)
						{
							if ("MakeCall".equalsIgnoreCase(name))
							{
								actionList.add(value1);
							}

						} else {

							errorMessage = errorMessage + thisErrorMessage + "; ";
						}

					}

					if (actionList.size() > 0)
					{
						application.handlePostBridge(actionList);
					}

				} else errorMessage = "Voice bridge actions are missing";

			} else errorMessage = "Voice bridge failure";

		}
		catch(Exception e) {
			Log.error("manageVoiceBridge " + e);
			e.printStackTrace();
			errorMessage = "Internal error - " + e.toString();
		}

        return errorMessage.length() == 0 ? null : errorMessage;
	}
}
