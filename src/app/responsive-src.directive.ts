import { Directive, HostListener, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[appResponsiveSrc]',
})
export class ResponsiveSrcDirective implements OnInit {
  static readonly BREAKPOINTS = new Map(
    Object.entries({
      xs: 0,
      sm: 576,
      md: 768,
      lg: 992,
      xl: 1200,
      xxl: 1400,
    })
  );

  @Input()
  appResponsiveSrc: string[] = [];
  private _breakpoints: Map<string, number>;

  @HostListener('window:resize', ['$event.target'])
  private _onresize(target: Window) {
    console.log(target.innerWidth);
  }

  constructor() {}

  ngOnInit(): void {
    this._setSelectedBreakpoints();
  }

  private _setSelectedBreakpoints() {
    const invalidValues = this.appResponsiveSrc.filter(
      (bp) => !ResponsiveSrcDirective.BREAKPOINTS.has(bp)
    );
    if (invalidValues.length) {
      throw new TypeError(
        `appResponsiveSrc was given invalid values: ${invalidValues.join(', ')}`
      );
    }
    this._breakpoints = new Map(
      [...ResponsiveSrcDirective.BREAKPOINTS.entries()].filter(
        ([k, v]) => this.appResponsiveSrc.indexOf(k) >= 0
      )
    );
  }
}
