import React from "react";
import { View } from "react-native";
import PropTypes from "prop-types";
import { isNull, isUndefined, isEmpty } from "underscore";
import OTSubscriberView from "./views/OTSubscriberView";

import useOTStreams from "./hooks/useOTStreams";

function OTSubscriber({
	sessionId,
	eventHandlers,
	streamProperties,
	subscribeToSelf,
	properties,
	sessionInfo,
	containerStyle,
	style: propsStyle,
	children
}) {
	const streamIds = useOTStreams({
		sessionId,
		eventHandlers,
		streamProperties,
		subscribeToSelf,
		properties,
		sessionInfo
	});

	if (!children) {
		const childrenWithStreams = streamIds.map(streamId => {
			const streamProperties = streamProperties[streamId];
			const style = isEmpty(streamProperties)
				? propsStyle
				: isUndefined(streamProperties.style) || isNull(streamProperties.style)
				? propsStyle
				: streamProperties.style;
			return (
				<OTSubscriberView key={streamId} streamId={streamId} style={style} />
			);
		});
		return <View style={containerStyle}>{childrenWithStreams}</View>;
	}
	return children(streams) || null;
}

const viewPropTypes = View.propTypes;
OTSubscriber.propTypes = {
	...viewPropTypes,
	children: PropTypes.func,
	properties: PropTypes.object, // eslint-disable-line react/forbid-prop-types
	eventHandlers: PropTypes.object, // eslint-disable-line react/forbid-prop-types
	streamProperties: PropTypes.object, // eslint-disable-line react/forbid-prop-types
	containerStyle: PropTypes.object, // eslint-disable-line react/forbid-prop-types
	sessionInfo: PropTypes.object, // eslint-disable-line react/forbid-prop-types
	subscribeToSelf: PropTypes.bool
};

OTSubscriber.defaultProps = {
	properties: {},
	eventHandlers: {},
	streamProperties: {},
	containerStyle: {},
	sessionInfo: {},
	subscribeToSelf: false
};
