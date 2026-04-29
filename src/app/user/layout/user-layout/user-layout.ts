import { Component } from '@angular/core';
import { AdminRoutingModule } from "../../../admin/admin-routing-module";
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { RouterOutlet } from '@angular/router';
import { ChatbotComponent } from '../../../chatbot/chatbot';

@Component({
  selector: 'app-user-layout',
  imports: [Header, Footer, RouterOutlet, ChatbotComponent],
  templateUrl: './user-layout.html',
  styleUrl: './user-layout.css',
})
export class UserLayout {}
