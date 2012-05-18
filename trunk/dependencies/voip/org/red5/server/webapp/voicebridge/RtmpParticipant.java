package org.red5.server.webapp.voicebridge;

import java.io.*;
import java.util.*;
import com.milgra.server.*;

import java.nio.*;
import com.sun.voip.server.MemberReceiver;
import com.sun.voip.AudioConversion;

public class RtmpParticipant extends ThirdParty {

    public MemberReceiver memberReceiver;
    private String publishName;
    private String playName;
    private int kt = 0;
    private int kt2 = 0;
    private short counter = 0;

    private static final int ULAW_CODEC_ID = 130;

	private long startTime = System.currentTimeMillis();
	private StreamRouter router = null;
	private StreamPlayer player = null;


    public RtmpParticipant(MemberReceiver memberReceiver)
    {
		this.memberReceiver = memberReceiver;
	}

    // ------------------------------------------------------------------------
    //
    // Overide
    //
    // ------------------------------------------------------------------------


    @Override public void push ( byte[] stream )
	{
		try {

			if (memberReceiver != null && stream.length > 0)
			{
				int[] l16Buffer = new int[stream.length - 1];
				AudioConversion.ulawToLinear(stream, 1, stream.length - 1, l16Buffer);

				l16Buffer = normalize(l16Buffer);

				memberReceiver.handleRTMPMedia(l16Buffer, counter++);

				if ( kt2 < 10 )
				{
					loggerdebug( "**** RtmpParticipant.push() - dataRecieved -> length = " + stream.length);
				}

			}
		}
		catch ( Exception e ) {
			loggererror( "RtmpParticipant => push error " + e );
			e.printStackTrace();
		}

		kt2++;
	}

    // ------------------------------------------------------------------------
    //
    // Public
    //
    // ------------------------------------------------------------------------

    public void startStream(String publishName, String playName) {

        System.out.println( "RtmpParticipant startStream" );

		if (publishName == null || playName == null)
		{
			loggererror( "RtmpParticipant startStream stream names invalid " + publishName + " " + playName);

		} else {

			this.publishName = publishName;
			this.playName = playName;

			kt = 0;
			kt2 = 0;
			counter = 0;
         	startTime = System.currentTimeMillis();

			try {

				router = new StreamRouter(-1, -1, publishName, "live", null);
				router.enable( );
				Server.registerRouter( router );
				Server.connectRouter( router , publishName);
				router.publishNotify();

				player = new StreamPlayer(-1, -1, -1, -1, playName,  null );
				player.thirdParty = this;
				player.enable( );

				Server.registerPlayer( player );
				Server.connectPlayer( player , playName );

			}
			catch ( Exception e ) {
				loggererror( "RtmpParticipant startStream exception " + e );
			}
		}
    }


    public void stopStream()
    {

        System.out.println( "RtmpParticipant stopStream" );

        try {
			router.unPublishNotify();
			router.disable( );
			router.close( );
			router = null;

			player.thirdParty = null;
			player.disable( );
			player.close( );
			player = null;
        }
        catch ( Exception e ) {
            loggererror( "RtmpParticipant stopStream exception " + e );
        }

    }

    // ------------------------------------------------------------------------
    //
    // Implementations
    //
    // ------------------------------------------------------------------------



	public void pushAudio(int[] pcmBuffer)
	{
		if (router == null || player == null || pcmBuffer.length < 160) return;

		if ( kt < 10 )
		{
			loggerdebug( "++++ RtmpParticipant.pushAudio() - dataSent -> length = " + pcmBuffer.length);
		}

		try {
			pcmBuffer = normalize(pcmBuffer);

			int ts = (int)(System.currentTimeMillis() - startTime);

			RtmpPacket packet = new RtmpPacket();
			packet.bodyType = 0x08;
			packet.flvStamp = (kt == 0) ? 0: ts;
			packet.first = (kt == 0);
			packet.bodySize = pcmBuffer.length + 1;

			packet.body = new byte[pcmBuffer.length + 1];
			packet.body[0] = (byte) ULAW_CODEC_ID;

			AudioConversion.linearToUlaw(pcmBuffer, packet.body, 1);

			router.take(packet);

		} catch (Exception e) {

			loggererror( "RtmpParticipant pushAudio exception " + e );
		}

		kt++;
	}


    private void loggerdebug( String s ) {

        System.out.println( s );
    }

    private void loggererror( String s ) {

        System.err.println( "[ERROR] " + s );
    }

   	private int[] normalize(int[] audio)
   	{
	    // Scan for max peak value here
	    float peak = 0;
		for (int n = 0; n < audio.length; n++)
		{
			int val = Math.abs(audio[n]);
			if (val > peak)
			{
				peak = val;
			}
		}

		// Peak is now the loudest point, calculate ratio
		float r1 = 32768 / peak;

		// Don't increase by over 500% to prevent loud background noise, and normalize to 75%
		float ratio = Math.min(r1, 5) * .75f;

		for (int n = 0; n < audio.length; n++)
		{
			audio[n] *= ratio;
		}

		return audio;
   	}

}
