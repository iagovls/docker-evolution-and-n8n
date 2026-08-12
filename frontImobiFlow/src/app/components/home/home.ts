import { Component, inject } from '@angular/core';
import { Menu } from "../menu/menu";
import { RouterOutlet } from "@angular/router";
import { Header } from "../header/header";
import { MainComponent } from "../main-component/main-component";

@Component({
  selector: 'app-home',
  imports: [Menu, RouterOutlet, Header, MainComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
}
