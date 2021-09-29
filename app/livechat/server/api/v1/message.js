import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { Random } from 'meteor/random';

import { Messages, LivechatRooms, LivechatVisitors } from '../../../../models';
import { hasPermission } from '../../../../authorization';
import { API } from '../../../../api/server';
import { loadMessageHistory } from '../../../../lib';
import { findGuest, findRoom, normalizeHttpHeaderData } from '../lib/livechat';
import { Livechat } from '../../lib/Livechat';
import { normalizeMessageFileUpload } from '../../../../utils/server/functions/normalizeMessageFileUpload';
import { settings } from '../../../../settings/server';
import { OmnichannelSourceType } from '../../../../../definition/IRoom';

API.v1.addRoute('livechat/message', {
	post() {
		try {
			check(this.bodyParams, {
				_id: Match.Maybe(String),
				token: String,
				rid: String,
				msg: String,
				agent: Match.Maybe({
					agentId: String,
					username: String,
				}),
			});

			const { token, rid, agent, msg } = this.bodyParams;

			const guest = findGuest(token);
			if (!guest) {
				throw new Meteor.Error('invalid-token');
			}

			const room = findRoom(token, rid);
			if (!room) {
				throw new Meteor.Error('invalid-room');
			}

			if (!room.open) {
				throw new Meteor.Error('room-closed');
			}

			if (settings.get('Livechat_enable_message_character_limit') && msg.length > parseInt(settings.get('Livechat_message_character_limit'))) {
				throw new Meteor.Error('message-length-exceeds-character-limit');
			}

			const _id = this.bodyParams._id || Random.id();

			const sendMessage = {
				guest,
				message: {
					_id,
					rid,
					msg,
					token,
				},
				agent,
				roomInfo: {
					source: {
						type: this.isWidget() ? OmnichannelSourceType.WIDGET : OmnichannelSourceType.API,
					},
				},
			};

			const result = Promise.await(Livechat.sendMessage(sendMessage));
			if (result) {
				const message = Messages.findOneById(_id);
				return API.v1.success({ message });
			}

			return API.v1.failure();
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});

API.v1.addRoute('livechat/message/:_id', {
	get() {
		try {
			check(this.urlParams, {
				_id: String,
			});

			check(this.queryParams, {
				token: String,
				rid: String,
			});

			const { token, rid } = this.queryParams;
			const { _id } = this.urlParams;

			const guest = findGuest(token);
			if (!guest) {
				throw new Meteor.Error('invalid-token');
			}

			const room = findRoom(token, rid);
			if (!room) {
				throw new Meteor.Error('invalid-room');
			}

			let message = Messages.findOneById(_id);
			if (!message) {
				throw new Meteor.Error('invalid-message');
			}

			if (message.file) {
				message = normalizeMessageFileUpload(message);
			}

			return API.v1.success({ message });
		} catch (e) {
			return API.v1.failure(e);
		}
	},

	put() {
		try {
			check(this.urlParams, {
				_id: String,
			});

			check(this.bodyParams, {
				token: String,
				rid: String,
				msg: String,
			});

			const { token, rid } = this.bodyParams;
			const { _id } = this.urlParams;

			const guest = findGuest(token);
			if (!guest) {
				throw new Meteor.Error('invalid-token');
			}

			const room = findRoom(token, rid);
			if (!room) {
				throw new Meteor.Error('invalid-room');
			}

			const msg = Messages.findOneById(_id);
			if (!msg) {
				throw new Meteor.Error('invalid-message');
			}

			const result = Livechat.updateMessage({ guest, message: { _id: msg._id, msg: this.bodyParams.msg } });
			if (result) {
				let message = Messages.findOneById(_id);
				if (message.file) {
					message = normalizeMessageFileUpload(message);
				}

				return API.v1.success({ message });
			}

			return API.v1.failure();
		} catch (e) {
			return API.v1.failure(e);
		}
	},
	delete() {
		try {
			check(this.urlParams, {
				_id: String,
			});

			check(this.bodyParams, {
				token: String,
				rid: String,
			});

			const { token, rid } = this.bodyParams;
			const { _id } = this.urlParams;

			const guest = findGuest(token);
			if (!guest) {
				throw new Meteor.Error('invalid-token');
			}

			const room = findRoom(token, rid);
			if (!room) {
				throw new Meteor.Error('invalid-room');
			}

			const message = Messages.findOneById(_id);
			if (!message) {
				throw new Meteor.Error('invalid-message');
			}

			const result = Livechat.deleteMessage({ guest, message });
			if (result) {
				return API.v1.success({
					message: {
						_id,
						ts: new Date().toISOString(),
					},
				});
			}

			return API.v1.failure();
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});

API.v1.addRoute('livechat/messages.history/:rid', {
	get() {
		try {
			check(this.urlParams, {
				rid: String,
			});

			const { offset } = this.getPaginationItems();
			const { searchText: text, token } = this.queryParams;
			const { rid } = this.urlParams;
			const { sort } = this.parseJsonQuery();

			if (!token) {
				throw new Meteor.Error('error-token-param-not-provided', 'The required "token" query param is missing.');
			}

			const guest = findGuest(token);
			if (!guest) {
				throw new Meteor.Error('invalid-token');
			}

			const room = findRoom(token, rid);
			if (!room) {
				throw new Meteor.Error('invalid-room');
			}

			let ls = undefined;
			if (this.queryParams.ls) {
				ls = new Date(this.queryParams.ls);
			}

			let end = undefined;
			if (this.queryParams.end) {
				end = new Date(this.queryParams.end);
			}

			let limit = 20;
			if (this.queryParams.limit) {
				limit = parseInt(this.queryParams.limit);
			}

			const messages = loadMessageHistory({ userId: guest._id, rid, end, limit, ls, sort, offset, text })
				.messages
				.map(normalizeMessageFileUpload);
			return API.v1.success({ messages });
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});

API.v1.addRoute('livechat/messages', { authRequired: true }, {
	post() {
		if (!hasPermission(this.userId, 'view-livechat-manager')) {
			return API.v1.unauthorized();
		}

		if (!this.bodyParams.visitor) {
			return API.v1.failure('Body param "visitor" is required');
		}
		if (!this.bodyParams.visitor.token) {
			return API.v1.failure('Body param "visitor.token" is required');
		}
		if (!this.bodyParams.messages) {
			return API.v1.failure('Body param "messages" is required');
		}
		if (!(this.bodyParams.messages instanceof Array)) {
			return API.v1.failure('Body param "messages" is not an array');
		}
		if (this.bodyParams.messages.length === 0) {
			return API.v1.failure('Body param "messages" is empty');
		}

		const visitorToken = this.bodyParams.visitor.token;

		let visitor = LivechatVisitors.getVisitorByToken(visitorToken);
		let rid;
		if (visitor) {
			const rooms = LivechatRooms.findOpenByVisitorToken(visitorToken).fetch();
			if (rooms && rooms.length > 0) {
				rid = rooms[0]._id;
			} else {
				rid = Random.id();
			}
		} else {
			rid = Random.id();

			const guest = this.bodyParams.visitor;
			guest.connectionData = normalizeHttpHeaderData(this.request.headers);

			const visitorId = Livechat.registerGuest(guest);
			visitor = LivechatVisitors.findOneById(visitorId);
		}

		const sentMessages = this.bodyParams.messages.map((message) => {
			const sendMessage = {
				guest: visitor,
				message: {
					_id: Random.id(),
					rid,
					token: visitorToken,
					msg: message.msg,
				},
				roomInfo: {
					source: {
						type: this.isWidget() ? OmnichannelSourceType.WIDGET : OmnichannelSourceType.API,
					},
				},
			};
			const sentMessage = Promise.await(Livechat.sendMessage(sendMessage));
			return {
				username: sentMessage.u.username,
				msg: sentMessage.msg,
				ts: sentMessage.ts,
			};
		});

		return API.v1.success({
			messages: sentMessages,
		});
	},
});
