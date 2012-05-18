package org.red5.logging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


public class Red5LoggerFactory {

	@SuppressWarnings({ "unchecked", "rawtypes" })
	public static Logger getLogger(Class<?> clazz)
	{
		return LoggerFactory.getLogger(clazz);
	}

	@SuppressWarnings({ "rawtypes" })
	public static Logger getLogger(Class clazz, String contextName)
	{
		return LoggerFactory.getLogger(clazz);
	}

}