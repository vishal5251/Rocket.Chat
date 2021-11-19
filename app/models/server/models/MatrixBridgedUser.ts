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
		const bridgedUser: IMatrixBridgedUser = this.findOne({ uid });

		return bridgedUser ? bridgedUser.mui : null;
	}

	getId(mui: string): string | null {
		const bridgedUser: IMatrixBridgedUser = this.findOne({ mui });

		return bridgedUser ? bridgedUser.uid : null;
	}
}

export const MatrixBridgedUser = new MatrixBridgedUserModel();
