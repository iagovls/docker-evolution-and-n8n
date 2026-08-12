import { Routes } from '@angular/router';
import { authGuard, publicGuard } from './guards/auth.guard';
import { LeadsComponent } from './components/leads-component/leads-component';
import { PropertyComponent } from './components/property-component/property-component';
import { NegotiationsComponent } from './components/negotiations-component/negotiations-component';
import { CalendarComponent } from './components/calendar-component/calendar-component';
import { LoginComponent } from './components/login-component/login-component';
import { RecoveryComponent } from './components/recovery-component/recovery-component';
import { ResetPasswordComponent } from './components/reset-password-component/reset-password-component';
import { AccountComponent } from './components/account-component/account-component';

export const routes: Routes = [
    {path: 'login', component: LoginComponent, title: 'Login', canActivate: [publicGuard]},
    {path: 'esqueci-senha', component: RecoveryComponent, title: 'Esqueci a senha', canActivate: [publicGuard]},
    {path: 'redefinir-senha', component: ResetPasswordComponent, title: 'Redefinir senha', canActivate: [publicGuard]},

    {path: 'leads', component: LeadsComponent, title: 'Leads', canActivate: [authGuard]},
    {path: 'imoveis', component: PropertyComponent, title: 'Imóveis', canActivate: [authGuard]},
    {path: 'agenda', component: CalendarComponent, title: 'Agenda', canActivate: [authGuard]},
    {path: 'negociacoes', component: NegotiationsComponent, title: 'Negociações', canActivate: [authGuard]},
    {path: 'conta', component: AccountComponent, title: 'Minha Conta', canActivate: [authGuard]},

    {path: '', redirectTo: 'leads', pathMatch: 'full'},
    {path: '**', redirectTo: 'leads', pathMatch: 'full'}
];
