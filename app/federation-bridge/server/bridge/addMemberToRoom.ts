// @ts-ignore
import { MatrixBridgedUser, MatrixBridgedRoom, Users } from '../../../models';
// @ts-ignore
import { addUserToRoom, createRoom, removeUserFromRoom } from '../../../lib';
import { IMatrixEvent } from '../definitions/IMatrixEvent';
import { MatrixEventType } from '../definitions/MatrixEventType';
import { AddMemberToRoomMembership } from '../IMatrixEventContent/IMatrixEventContentAddMemberToRoom';
import { SetRoomJoinRules } from '../IMatrixEventContent/IMatrixEventContentSetRoomJoinRules';
import { currentServer, SERVER, servers } from '../servers';
import { createUser } from '../methods';
import { matrixEventQueue } from './bridge';

export const handleAddMemberToRoom = async (
	event: IMatrixEvent<MatrixEventType.ADD_MEMBER_TO_ROOM>,
): Promise<void> => {
	const {
		room_id: matrixRoomId,
		sender: senderMatrixUserId,
		state_key: affectedMatrixUserId,
		content: { displayname: displayName, membership },
		invite_room_state: inviteRoomState,
	} = event;

	console.log(JSON.stringify(event, null, 2));

	// // We ignore the bot
	// if (affectedMatrixUserId.startsWith(`@rc_bot:`)) {
	// 	return;
	// }

	// Find the bridged room id
	const roomId = await MatrixBridgedRoom.getId(matrixRoomId);

	// Find the bridged user id
	const senderUserId = await MatrixBridgedUser.getId(senderMatrixUserId);
	const affectedUserId = await MatrixBridgedUser.getId(affectedMatrixUserId);

	// Find the user
	const senderUser = await Users.findOneById(senderUserId);
	const affectedUser = await Users.findOneById(affectedUserId);

	switch (membership) {
		case AddMemberToRoomMembership.JOIN:
			addUserToRoom(roomId, affectedUser);
			break;
		case AddMemberToRoomMembership.INVITE:
			// // If the sender user does not exist, it means we need to create it
			// let creatorUser = senderUser;
			// if (!creatorUser) {
			// 	creatorUser = createUser(senderMatrixUserId, senderMatrixUserId);
			// }
			//
			// // If the invited user does not exist, it means we need to create it
			// let invitedUser = affectedUser;
			// if (!invitedUser) {
			// 	invitedUser = createUser(affectedMatrixUserId, displayName);
			// }

			// // Create the room if necessary
			// const destinationRoomId = roomId;

			if (!roomId && inviteRoomState) {
				// // Ensure we run all the room events first
				// for (const event of inviteRoomState) {
				// 	// TODO: Handle error
				// 	matrixEventQueue.push(event).catch((err) => console.error(err));
				// }
				//
				// // Re-add the current event to the queue
				// // TODO: Handle error
				// matrixEventQueue.push(event).catch((err) => console.error(err));

				// Stop
				return;
			}

			addUserToRoom(roomId, affectedUser, senderUser);
			break;
		case AddMemberToRoomMembership.LEAVE:
			removeUserFromRoom(roomId, affectedUser, {
				byUser: senderUser,
			});
			break;
	}
};
