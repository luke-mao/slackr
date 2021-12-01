import { BACKEND_PORT } from './config.js';

// access the vm instance on google cloud.
// you can view the docs using http://35.244.125.146:5005/docs/ 
export const BACKEND = `http://35.244.125.146`;

export const URL_LOGIN = `${BACKEND}/auth/login`;
export const URL_REGISTER = `${BACKEND}/auth/register`;

export const URL_CHANNEL = `${BACKEND}/channel`;

export const URL_CHANNEL_DETAIL = (channelId) => { return `${BACKEND}/channel/${channelId}`; };

export const URL_SPECIFIC_USER = (userId) => { return `${BACKEND}/user/${userId}`;};

export const URL_JOIN_CHANNEL = (channelId) => { return `${BACKEND}/channel/${channelId}/join`; };

export const URL_LEAVE_CHANNEL = (channelId) => { return `${BACKEND}/channel/${channelId}/leave`; };

export const URL_CHANNEL_MESSAGE = (channelId, startIdx) => { return `${BACKEND}/message/${channelId}?start=${startIdx}`; };

export const URL_DELETE_MESSAGE = (channelId, messageId) => { return `${BACKEND}/message/${channelId}/${messageId}`; };

export const URL_UPDATE_MESSAGE = (channelId, messageId) => { return `${BACKEND}/message/${channelId}/${messageId}`; };

export const URL_REACT_MESSAGE = (channelId, messageId) => { return `${BACKEND}/message/react/${channelId}/${messageId}`; };

export const URL_UNREACT_MESSAGE = (channelId, messageId) => { return `${BACKEND}/message/unreact/${channelId}/${messageId}`; };

export const URL_PIN_MESSAGE = (channelId, messageId) => { return `${BACKEND}/message/pin/${channelId}/${messageId}`; };

export const URL_UNPIN_MESSAGE = (channelId, messageId) => { return `${BACKEND}/message/unpin/${channelId}/${messageId}`; };

export const URL_ALL_USERS = `${BACKEND}/user`;

export const URL_CHANNEL_INVITE = (channelId) => { return `${BACKEND}/channel/${channelId}/invite`; };

export const URL_UPDATE_PROFILE = `${BACKEND}/user`;

export const URL_POST_MESSAGE = (channelId) => { return `${BACKEND}/message/${channelId}`; };
