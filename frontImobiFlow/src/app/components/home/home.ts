import { Component, inject } from '@angular/core';
import { Menu } from "../menu/menu";
import { Header } from "../header/header";
import { MainComponent } from "../main-component/main-component";

@Component({
  selector: 'app-home',
  imports: [Menu, Header, MainComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
}
