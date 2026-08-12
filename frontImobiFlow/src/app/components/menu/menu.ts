import { Component, inject, Type } from '@angular/core';
import { Goal } from "../goal/goal";
import { LogoComponent } from "../logo-component/logo-component";
import { NgComponentOutlet } from '@angular/common';
import { MenuService } from '../../services/menu-service';
import { RouterLink } from "@angular/router";
import { AccountIcon } from '../icons/account-icon/account-icon';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [Goal, LogoComponent, NgComponentOutlet, RouterLink, AccountIcon],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu {
  public menuService = inject(MenuService);
  public accountIcon = AccountIcon;

  style = 'md:p-1 md:bg-verde-200 md:rounded-md md:border md:shadow md:border-emerald-500';
}
