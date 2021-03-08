import {
  AfterViewInit,
  Directive,
  ElementRef,
  Input,
  OnInit,
  Renderer2,
} from '@angular/core';

@Directive({
  selector: '[appResponsiveSrcSet]',
})
export class ResponsiveSrcDirective implements OnInit, AfterViewInit {
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
  appResponsiveSrcSet: string[] = [];

  private _breakpoints: Map<string, number>;
  private _baseSrc!: string;
  private readonly _urls: Map<string, string> = new Map();
  private _imgEl: HTMLImageElement;

  constructor(
    private _elementRef: ElementRef<HTMLElement>,
    private _renderer: Renderer2
  ) {
    if (_elementRef.nativeElement.tagName.toLocaleLowerCase() !== 'picture') {
      throw new TypeError(
        `appResponsiveSrcSet directive shoud be on picture. Got : ${_elementRef.nativeElement.tagName.toLocaleLowerCase()}`
      );
    }
  }
  ngAfterViewInit(): void {
    this._imgEl = this._elementRef.nativeElement.querySelector('img');
    this._baseSrc = this._imgEl.src;
    this._breakpoints = new Map(
      [...ResponsiveSrcDirective.BREAKPOINTS.entries()]
        .filter(([k, v]) => this.appResponsiveSrcSet.indexOf(k) >= 0)
        .sort(([k1, bp1], [k2, bp2]) => bp1 - bp2)
    );
    this._genarateSrcSet();
  }

  ngOnInit(): void {
    this._setSelectedBreakpoints();
  }

  private _setSelectedBreakpoints() {
    if (!this.appResponsiveSrcSet) {
      this.appResponsiveSrcSet = [...ResponsiveSrcDirective.BREAKPOINTS.keys()];
    }
    const invalidValues = this.appResponsiveSrcSet.filter(
      (bp) => !ResponsiveSrcDirective.BREAKPOINTS.has(bp)
    );
    if (invalidValues.length) {
      throw new TypeError(
        `appResponsiveSrc was given invalid values: ${invalidValues.join(', ')}`
      );
    }
  }

  private _genarateSrcSet() {
    const match = new RegExp(
      `^(?<basename>.+?)(?<breakpoint>-(?:${[
        ...ResponsiveSrcDirective.BREAKPOINTS.keys(),
      ].join('|')}).?)?(?<extention>\.[0-9a-z]+?)$`
    ).exec(this._baseSrc);
    if (match) {
      const groups = match.groups;

      [...this._breakpoints.keys()].forEach((bp) =>
        this._urls.set(bp, `${groups.basename}-${bp}.${groups.extention}`)
      );

      this._renderer.listen(this._imgEl, 'error', (error: Event) =>
        this._removeSourceElement((error.target as HTMLImageElement).currentSrc)
      );

      let beforeEl = this._imgEl;
      [...this._urls.entries()].forEach(([bp, url]) => {
        const sourceEl = this._renderer.createElement('source');
        this._renderer.setAttribute(sourceEl, 'media', this._getMedia(bp));
        this._renderer.setAttribute(sourceEl, 'srcset', url);

        this._renderer.insertBefore(
          this._elementRef.nativeElement,
          sourceEl,
          beforeEl
        );
      });
    }
  }
  private _removeSourceElement(src: string): boolean | void {
    this._elementRef.nativeElement
      .querySelectorAll(`source[srcset="${src}"], source[src="${src}"]`)
      .forEach((el) => {
        this._renderer.removeChild(this._elementRef.nativeElement, el);
      });
  }

  private _getMedia(bp: string): string {
    const breakpoint = [...this._breakpoints.keys()];
    const i = breakpoint.indexOf(bp) + 1;

    return i < breakpoint.length
      ? `(max-width: ${this._breakpoints.get(breakpoint[i])}px)`
      : '';
  }
}
