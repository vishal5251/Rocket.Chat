import { Base } from './_Base';

export interface IMatrixBridgedUser {
	uid: string;
	mui: string;
}

class MatrixBridgedUserModel extends Base {
	constructor() {
		super('matrix_bridged_users');
		this.tryEnsureIndex({ uid: 1 }, { unique: true, sparse: true });
		this.tryEnsureIndex({ mui: 1 }, { unique: true, sparse: true });
	}

	getMatrixId(uid: string): string | null {
		const bridgedRoom: IMatrixBridgedUser = this.findOne({ uid });

		return bridgedRoom ? bridgedRoom.mui : null;
	}

	getId(mui: string): string | null {
		const bridgedRoom: IMatrixBridgedUser = this.findOne({ mui });

		return bridgedRoom ? bridgedRoom.uid : null;
	}
}

export const MatrixBridgedUser = new MatrixBridgedUserModel();
