import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { Renderer2 } from '@angular/core';

import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';

import { Dataset, DateRange } from '@models';

import { TippyService } from 'ng-tippy';

// import 'tippy.js/dist/tippy.css';
// import tippy from 'tippy.js';

@Component({
  selector: 'app-dataset',
  templateUrl: './dataset.component.html',
  styleUrls: ['./dataset.component.scss']
})
export class DatasetComponent implements OnInit, AfterViewInit {
  @Input() dataset: Dataset;
  @Input() isSelected: boolean;

  public tippyDiv;
  public tippyDivID: string;
  public tippyTemplate;
  public tippyTemplateID: string;
  public tippyTemplateIDRef: string;
  public tippyTemplateHTMLElement;
  public detailedDatasetInfoIcon = faInfoCircle;
  public dynTipInstance: any;

  // @ts-ignore
  constructor(private tippyService: TippyService,
              private renderer: Renderer2) { }

  ngOnInit(): void {
    const id = this.dataset.id.replace(/\s/g, '');
    this.tippyTemplateID = 'template-' + id;
    this.tippyTemplateIDRef = '#' + this.tippyTemplateID;
    this.tippyDivID = 'tippy-' + id;

    // this.dynTipInstance = tippy(this.tippyDivID, {
    //   content: 'Aliens are real.',
    //   allowHTML: true,
    //   arrow: true,
    //   interactive: true,
    // });
  }

  ngAfterViewInit(): void {
    console.log('afterViewInit');
    console.log('this.tippyTemplateIDRef:', this.tippyTemplateIDRef);
    const myContainer = document.getElementById(this.tippyTemplateID);
    console.log('myContainer:', myContainer);
    this.tippyTemplateHTMLElement = myContainer;

    this.tippyTemplate = this.createTippyTemplate(this.tippyTemplateID);
    console.log('this.tippyDiv:', this.tippyTemplate);
  }

  public onOpenHelp() {
    window.open(this.dataset.infoUrl);
  }

  public prettyDateRange(dateRange: DateRange): string {
    const { start, end } = dateRange;

    const startYear = start.getFullYear();
    const endYear = (!end) ? 'Present' : end.getFullYear();

    return startYear === endYear ?
      `${startYear}`.trim() :
      `${startYear} to ${endYear}`.trim();
  }

  public onInfoClicked(e: Event): void {
    e.stopPropagation();
  }

  createTippyTemplate(id: string) {
    // Use Angular Renderer2 to create the div element
    const tippyTemplate = this.renderer.createElement('div');
    // Set the id of the div
    this.renderer.setProperty(tippyTemplate, 'id', id);

    // Append the created div to the body element
    this.renderer.appendChild(document.body, tippyTemplate);

    return tippyTemplate;
  }
  // createTippyTemplate(id: string) {
  //   // Use Angular Renderer2 to create the div element
  //   const tippyTemplate = this.renderer.createElement('div');
  //   // Set the id of the div
  //   this.renderer.setProperty(tippyTemplate, 'id', id);
  //
  //   // Append the created div to the body element
  //   this.renderer.appendChild(document.body, tippyTemplate);
  //
  //   this.dynTipInstance = tippy(tippyTemplate, {
  //     content: 'Vampires are real.',
  //     allowHTML: true,
  //     arrow: true,
  //     interactive: true,
  //   });
  //
  //   return tippyTemplate;
  // }
}
