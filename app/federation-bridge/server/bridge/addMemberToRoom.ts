// @ts-ignore
import { MatrixBridgedUser, MatrixBridgedRoom, Users, Rooms } from '../../../models';
// @ts-ignore
import { addUserToRoom, createRoom, removeUserFromRoom } from '../../../lib';
import { IMatrixEvent } from '../definitions/IMatrixEvent';
import { MatrixEventType } from '../definitions/MatrixEventType';
import { AddMemberToRoomMembership } from '../IMatrixEventContent/IMatrixEventContentAddMemberToRoom';
import { createUser } from '../methods/createUser';
import { setRoomJoinRules } from './setRoomJoinRules';
import { setRoomName } from './setRoomName';
import { addToQueue } from './bridge';

const ensureRoom = async (matrixRoomId: string, roomId: string, username: string, roomState?: IMatrixEvent<MatrixEventType>[]): Promise<string> => {
	const room = await Rooms.findOneById(roomId);
	// If the room does not exist, create it
	if (!room) {
		// Create temp room name
		const roomName = `Federation-${ matrixRoomId.split(':')[0].replace('!', '') }`;

		const { rid: createdRoomId } = createRoom('c', roomName, username);

		roomId = createdRoomId;

		MatrixBridgedRoom.insert({ rid: roomId, mri: matrixRoomId });

		// TODO: this should be better
		/* eslint-disable no-await-in-loop */
		for (const state of roomState || []) {
			switch (state.type) {
				case 'm.room.create':
					continue;
				case 'm.room.join_rules': {
					// @ts-ignore
					// eslint-disable-next-line @typescript-eslint/camelcase
					await setRoomJoinRules({ room_id: roomId, ...state });

					break;
				}
				case 'm.room.name': {
					// @ts-ignore
					// eslint-disable-next-line @typescript-eslint/camelcase
					await setRoomName({ room_id: roomId, ...state });

					break;
				}
				case 'm.room.member': {
					// @ts-ignore
					if (state.content.membership === 'join') {
						// @ts-ignore
						// eslint-disable-next-line @typescript-eslint/camelcase,@typescript-eslint/no-use-before-define
						await handleAddMemberToRoom({ room_id: roomId, ...state });
					}

					break;
				}
			}
		}
		/* eslint-enable no-await-in-loop */
	}

	return roomId;
};

export const handleAddMemberToRoom = async (
	event: IMatrixEvent<MatrixEventType.ADD_MEMBER_TO_ROOM>,
): Promise<void> => {
	const {
		room_id: matrixRoomId,
		sender: senderMatrixUserId,
		state_key: affectedMatrixUserId,
		content: { displayname: displayName, membership },
		invite_room_state: roomState,
	} = event;

	// Find the bridged room id
	let roomId = await MatrixBridgedRoom.getId(matrixRoomId);

	// Find the sender user
	const senderUserId = await MatrixBridgedUser.getId(senderMatrixUserId);
	let senderUser = await Users.findOneById(senderUserId);
	// If the sender user does not exist, it means we need to create it
	if (!senderUser) {
		senderUser = await createUser(senderMatrixUserId, senderMatrixUserId);
	}

	// Find the affected user
	const affectedUserId = await MatrixBridgedUser.getId(affectedMatrixUserId);
	let affectedUser = await Users.findOneById(affectedUserId);
	// If the affected user does not exist, it means we need to create it
	if (!affectedUser) {
		affectedUser = await createUser(affectedMatrixUserId, displayName);
	}

	switch (membership) {
		case AddMemberToRoomMembership.JOIN:
			roomId = await ensureRoom(matrixRoomId, roomId, senderUser.username, roomState);

			addUserToRoom(roomId, affectedUser);
			break;
		case AddMemberToRoomMembership.INVITE:
			// Re-run the state first
			if (!roomId) {
				for (const state of roomState || []) {
					// eslint-disable-next-line @typescript-eslint/camelcase,no-await-in-loop
					addToQueue({ ...state, room_id: matrixRoomId });
				}

				addToQueue(event);

				return;
			}

			// If the room exists, then just add the user
			// TODO: this should be an invite
			addUserToRoom(roomId, affectedUser, senderUser);
			break;
		case AddMemberToRoomMembership.LEAVE:
			removeUserFromRoom(roomId, affectedUser, {
				byUser: senderUser,
			});
			break;
	}
};
