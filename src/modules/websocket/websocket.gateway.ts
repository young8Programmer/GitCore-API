import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/events',
})
export class WebSocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Repository events
  emitRepositoryCreated(repository: any) {
    this.server.emit('repository:created', repository);
  }

  emitRepositoryUpdated(repositoryId: string, repository: any) {
    this.server.to(`repo:${repositoryId}`).emit('repository:updated', repository);
  }

  // Commit events
  emitCommit(repositoryId: string, commit: any) {
    this.server.to(`repo:${repositoryId}`).emit('commit:created', commit);
    this.server.emit('commit:created', { repositoryId, ...commit });
  }

  // Branch events
  emitBranchCreated(repositoryId: string, branch: any) {
    this.server.to(`repo:${repositoryId}`).emit('branch:created', branch);
  }

  emitBranchDeleted(repositoryId: string, branchName: string) {
    this.server.to(`repo:${repositoryId}`).emit('branch:deleted', { branchName });
  }

  // Pull Request events
  emitPullRequestCreated(repositoryId: string, pr: any) {
    this.server.to(`repo:${repositoryId}`).emit('pull_request:created', pr);
    this.server.emit('pull_request:created', { repositoryId, ...pr });
  }

  emitPullRequestUpdated(repositoryId: string, pr: any) {
    this.server.to(`repo:${repositoryId}`).emit('pull_request:updated', pr);
  }

  emitPullRequestMerged(repositoryId: string, pr: any) {
    this.server.to(`repo:${repositoryId}`).emit('pull_request:merged', pr);
    this.server.emit('pull_request:merged', { repositoryId, ...pr });
  }

  emitPullRequestClosed(repositoryId: string, pr: any) {
    this.server.to(`repo:${repositoryId}`).emit('pull_request:closed', pr);
  }

  // User joins repository room
  joinRepositoryRoom(client: Socket, repositoryId: string) {
    client.join(`repo:${repositoryId}`);
    this.logger.log(`Client ${client.id} joined repo:${repositoryId}`);
  }

  // User leaves repository room
  leaveRepositoryRoom(client: Socket, repositoryId: string) {
    client.leave(`repo:${repositoryId}`);
    this.logger.log(`Client ${client.id} left repo:${repositoryId}`);
  }
}
