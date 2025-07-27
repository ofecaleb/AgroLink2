import PocketBase from 'pocketbase';

const pb = new PocketBase('http://localhost:8090');

export async function backupUser(user: any) {
  return pb.collection('users').create(user);
}

export async function getUser(id: string) {
  return pb.collection('users').getOne(id);
}

export async function backupResetRequest(resetRequest: any) {
  return pb.collection('resetRequests').create(resetRequest);
}

export async function getResetRequest(id: string) {
  return pb.collection('resetRequests').getOne(id);
} 