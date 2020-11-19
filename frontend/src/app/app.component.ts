import { Component, NgZone, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.scss' ]
})
export class AppComponent implements OnInit {
  apiUrl = 'http://localhost:3000';
  records = [];
  date;

  constructor(private zone: NgZone) { }

  ngOnInit() {
    setInterval(() => {
      this.date = new Date();
    }, 100);

    this.connect(this.apiUrl).subscribe(val => {
      console.log(JSON.parse(val));
      this.records.push(JSON.parse(val));
    });
  }
  connect(url): Observable<any> {
    return new Observable((observer) => {
      const es = new EventSource(url);

      es.onmessage = (event) => {
        console.log(this.date.getHours() + ':' + this.date.getMinutes() + ':' + this.date.getSeconds());

        this.zone.run(() => observer.next(
          event.data
        ));
      };
      es.onerror = (error) => {
        observer.error(error);
      };

    });
  }

}
