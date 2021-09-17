import Component from '@glimmer/component';
import { htmlSafe } from '@ember/template';

export default class StarRatingComponent extends Component {
  get safe_width() {
    const width = (this.args.score / 5) * 100;
    return htmlSafe(`width: ${width}%`);
  }
}
