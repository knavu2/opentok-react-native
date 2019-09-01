import { useState, useEffect } from "react";
import { Platform } from "react-native";
import { isNull, each } from "underscore";
import { OT, nativeEvents, setNativeEvents, removeNativeEvents } from "./OT";
import {
	sanitizeSubscriberEvents,
	sanitizeProperties
} from "./helpers/OTSubscriberHelper";
import { getOtrnErrorEventHandler } from "./helpers/OTHelper";

function useOTStreams({
	sessionId,
	eventHandlers,
	streamProperties,
	subscribeToSelf = false,
	properties,
	sessionInfo
}) {
	const [streams, setStreams] = useState([]);
	const componentEventsArray = Object.values(componentEvents);
	const otrnEventHandler = getOtrnErrorEventHandler(eventHandlers);

	const componentEvents = {
		streamDestroyed: Platform.select({
			android: "session:onStreamDropped",
			ios: "session:streamDestroyed"
		}),

		streamCreated: Platform.select({
			android: "session:onStreamReceived",
			ios: "session:streamCreated"
		})
	};

	const streamCreatedHandler = stream => {
		const subscriberProperties = isNull(streamProperties[stream.streamId])
			? sanitizeProperties(properties)
			: sanitizeProperties(streamProperties[stream.streamId]);
		// Subscribe to streams. If subscribeToSelf is true, subscribe also to his own stream
		const sessionInfoConnectionId =
			sessionInfo && sessionInfo.connection
				? sessionInfo.connection.connectionId
				: null;
		if (subscribeToSelf || sessionInfoConnectionId !== stream.connectionId) {
			OT.subscribeToStream(stream.streamId, subscriberProperties, error => {
				if (error) {
					otrnEventHandler(error);
				} else {
					setStreams(streams => [...streams, stream.streamId]);
				}
			});
		}
	};

	const streamDestroyedHandler = stream => {
		OT.removeSubscriber(stream.streamId, error => {
			if (error) {
				otrnEventHandler(error);
			} else {
				const indexOfStream = streams.indexOf(stream.streamId);
				const newState = streams.slice();
				newState.splice(indexOfStream, 1);
				setStreams(newState);
			}
		});
	};

	useEffect(() => {
		const { sessionId, eventHandlers } = props;

		const streamCreated = nativeEvents.addListener(
			`${sessionId}:${componentEvents.streamCreated}`,
			stream => streamCreatedHandler(stream)
		);
		const streamDestroyed = nativeEvents.addListener(
			`${sessionId}:${componentEvents.streamDestroyed}`,
			stream => streamDestroyedHandler(stream)
		);
		const subscriberEvents = sanitizeSubscriberEvents(eventHandlers);
		OT.setJSComponentEvents(componentEventsArray);
		setNativeEvents(subscriberEvents);

		// didUpdate
		each(streamProperties, (individualStreamProperties, streamId) => {
			const { subscribeToAudio, subscribeToVideo } = individualStreamProperties;
			OT.subscribeToAudio(streamId, subscribeToAudio);
			OT.subscribeToVideo(streamId, subscribeToVideo);
		});

		return function cleanup() {
			streamCreated.remove();
			streamDestroyed.remove();
			OT.removeJSComponentEvents(componentEventsArray);
			const events = sanitizeSubscriberEvents(eventHandlers);
			removeNativeEvents(events);
		};
	}, [sessionId, eventHandlers, streamProperties]);

	return streams;
}

export default useOTStreams;
