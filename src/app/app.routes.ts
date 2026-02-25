import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login';
import { RegisterComponent } from './features/auth/register/register';
import { ChatRoomComponent } from './features/chat/chat-room/chat-room';
import { RoomListComponent } from './features/rooms/room-list/room-list';
import { CreateRoomComponent } from './features/rooms/create-room/create-room';
import { LandingComponent } from './features/landing/landing';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    { path: '', component: LandingComponent },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'rooms', component: RoomListComponent, canActivate: [authGuard] },
    { path: 'rooms/create', component: CreateRoomComponent, canActivate: [authGuard] },
    { path: 'chat/:id', component: ChatRoomComponent, canActivate: [authGuard] },
    { path: '**', redirectTo: '' }
];
