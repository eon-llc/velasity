import Controller from '@ember/controller';
import ENV from 'velasity/config/environment';

export default class ValidatorsController extends Controller {
  api_url = ENV.APP.api_url;
  vote_key = ENV.APP.vote_key;

  point = { show: false };
  color = { pattern: ['#6b6d82', '#606dff'] };
  axis = {
    x: { show: false, tick: { format: '%Y-%m-%d %H:%M:%S %Z' }, type: 'timeseries' },
    y: { show: false },
  };
  legend = { show: false };
  size = { height: 100 };
  tooltip = {
    contents: function (data, defaultTitleFormat, defaultValueFormat) {
      var $$ = this,
        config = $$.config,
        valueFormat = config.tooltip_format_value || defaultValueFormat,
        text = "<div id='tooltip' class='d3-tip'>",
        i,
        value;

      for (i = 0; i < data.length; i++) {
        if (!(data[i] && (data[i].value || data[i].value === 0))) {
          continue;
        }
        if (i === 0) {
          text += `<span class='label'>${data[i].x}</span>`;
        }

        value = valueFormat(data[i].value, data[i].ratio, data[i].id, data[i].index);
        text += `<span class='title' style="color: ${config.data_colors[data[i].id]}">${data[i].id}</span>`;
        text += `<span class='value'>${value.toFixed(3)}</span>`;
      }

      text += `</div>`;

      return text;
    },
    position: function (data, width, height, thisElement) {
      var containerWidth, tooltipWidth, x, y;
      const element = thisElement.parentElement.parentElement.parentElement.parentElement.parentElement;
      containerWidth = element.clientWidth;
      tooltipWidth = element.querySelector('.c3-tooltip-container').clientWidth;
      x = parseInt(thisElement.getAttribute('x'));
      if (x + tooltipWidth > containerWidth) {
        x = containerWidth - tooltipWidth - 2;
      }
      y = thisElement.getAttribute('y');
      y = y - height;
      return {
        top: y - 10,
        left: x,
      };
    },
  };

  get grid() {
    if (this.model.performance) {
      const lines = this.model.performance.map((p) => {
        return { value: new Date(p.timestamp) };
      });

      return {
        lines: {
          front: false,
        },
        x: {
          lines: lines,
        },
      };
    } else {
      return [];
    }
  }

  get stakers() {
    if (this.model.stakers) {
      console.log(this.model.stakers);
      let stakers = [];
      const filtered_stakers = this.model.stakers.filter((e) => e.active_stake);
      const total_stake = filtered_stakers.map((e) => parseInt(e.active_stake)).reduce((acc, curr) => acc + curr);

      for (var j = 0; j < filtered_stakers.length; j++) {
        const staker = filtered_stakers[j];
        console.log(staker.active_stake);
        staker.share = ((parseInt(staker.active_stake) / parseInt(total_stake)) * 100).toFixed(1);
        stakers.push(staker);
      }

      stakers = stakers.sort((a, b) => (parseInt(a.active_stake) < parseInt(b.active_stake) ? 1 : -1));

      return stakers;
    } else {
      return false;
    }
  }

  get validator() {
    if (this.model.validator) {
      const count = this.model.validators.length;
      const validator_scores = this.validator_scores();
      let validators = this.model.validators;
      let halt_warning_set = false;
      let count_halt;
      let versions = [];

      for (var i = validators.length - 1; i >= 0; i--) {
        validators[i].activated_stake = Math.round(validators[i].activated_stake / 1000000000);
      }

      validators = validators.sort((a, b) => (a.activated_stake < b.activated_stake ? 1 : -1));

      const cumulative_sum = ((sum) => (value) => (sum += value))(0);
      const cumulative_stake = validators.map((e) => e.activated_stake).map(cumulative_sum);
      const total_stake = validators.map((e) => e.activated_stake).reduce((acc, curr) => acc + curr);

      for (var j = 0; j < validators.length; j++) {
        // assign calculated properties
        validators[j].score = validator_scores[validators[j].vote_pubkey];
        validators[j].activated_stake_percent = Math.round((validators[j].activated_stake / total_stake) * 100);
        validators[j].cumulative_stake = cumulative_stake[j];
        validators[j].cumulative_stake_percent = Math.round((cumulative_stake[j] / total_stake) * 100);
        validators[j].activated_stake = validators[j].activated_stake.toLocaleString();
        validators[j].last_vote = validators[j].last_vote.toLocaleString();
        validators[j].cumulative_width = this.safe_width(validators[j].cumulative_stake_percent);
        validators[j].own_width_w_offset = this.safe_width_w_offset(
          validators[j].activated_stake_percent,
          Math.abs(validators[j].activated_stake_percent - validators[j].cumulative_stake_percent)
        );
        validators[j].halt_warning = false;
        validators[j].style = halt_warning_set ? this.safe_delay(j + 2) : this.safe_delay(j + 1);

        // set halt warning
        if (cumulative_stake[j] > 33 && !halt_warning_set) {
          count_halt = j + 1;
          validators[j].halt_warning = true;
          halt_warning_set = true;
        }

        const version = validators[j].version ? validators[j].version : 'other';

        // calculate node version stats
        if (version in versions) {
          versions[version].count++;
        } else {
          versions[version] = { version: version, count: 1 };
        }
      }

      versions = Object.values(versions);

      versions.forEach((v) => {
        v.percent = ((v.count / count) * 100).toFixed(1);
      });

      versions = versions.sort((a, b) => (a.count < b.count ? 1 : -1));

      const delay_halt = this.safe_delay(count_halt + 1);

      return {
        count: count,
        count_halt: count_halt,
        delay_halt: delay_halt,
        list: validators,
        versions: versions,
      };
    } else {
      return false;
    }
  }

  get validator_score() {
    if (this.model.performance) {
      const performance = this.model.performance;
      let output = [];

      const cluster_median_vote_distance = performance.reduce((acc, curr) => acc + parseInt(curr.cluster_median_vote_distance), 0);
      const median_vote_distance = performance.reduce((acc, curr) => acc + parseInt(curr.median_vote_distance), 0);
      const cluster_average_vote_distance = performance.reduce((acc, curr) => acc + parseInt(curr.cluster_average_vote_distance), 0);
      const average_vote_distance = performance.reduce((acc, curr) => acc + parseInt(curr.average_vote_distance), 0);
      const cluster_median_vote = cluster_median_vote_distance >= median_vote_distance;
      const cluster_average_vote = cluster_average_vote_distance >= average_vote_distance;
      const vote_score = cluster_median_vote ? 2 : cluster_average_vote ? 1 : 0;

      const cluster_median_root_distance = performance.reduce((acc, curr) => acc + parseInt(curr.cluster_median_root_distance), 0);
      const median_root_distance = performance.reduce((acc, curr) => acc + parseInt(curr.median_root_distance), 0);
      const cluster_average_root_distance = performance.reduce((acc, curr) => acc + parseInt(curr.cluster_average_root_distance), 0);
      const average_root_distance = performance.reduce((acc, curr) => acc + parseInt(curr.average_root_distance), 0);
      const cluster_median_root = cluster_median_root_distance >= median_root_distance;
      const cluster_average_root = cluster_average_root_distance >= average_root_distance;
      const root_score = cluster_median_root ? 2 : cluster_average_root ? 1 : 0;

      const cluster_median_skip_rate = performance.reduce((acc, curr) => acc + parseInt(curr.cluster_median_skip_rate), 0);
      const median_skip_rate = performance.reduce((acc, curr) => acc + parseInt(curr.median_skip_rate), 0);
      const cluster_average_skip_rate = performance.reduce((acc, curr) => acc + parseInt(curr.cluster_average_skip_rate), 0);
      const average_skip_rate = performance.reduce((acc, curr) => acc + parseInt(curr.average_skip_rate), 0);
      const cluster_median_skip = cluster_median_skip_rate >= median_skip_rate;
      const cluster_average_skip = cluster_average_skip_rate >= average_skip_rate;
      const skip_score = cluster_median_skip ? 2 : cluster_average_skip ? 1 : 0;

      const total_score = (vote_score * 2.5 + root_score * 2.5 + skip_score * 2.5) / 3;

      output = {
        vote: vote_score * 2.5,
        root: root_score * 2.5,
        skip: skip_score * 2.5,
        total: total_score,
      };

      return output;
    } else {
      return false;
    }
  }

  get validator_performance() {
    if (this.model.performance) {
      const validator_vote = ['Validator Median', ...this.model.performance.map((e) => e.median_vote_distance)];
      const validator_root = ['Validator Median', ...this.model.performance.map((e) => e.median_root_distance)];
      const validator_skip = ['Validator Median', ...this.model.performance.map((e) => e.median_skip_rate)];
      const cluster_vote = ['Network Median', ...this.model.performance.map((e) => e.cluster_median_vote_distance)];
      const cluster_root = ['Network Median', ...this.model.performance.map((e) => e.cluster_median_root_distance)];
      const cluster_skip = ['Network Median', ...this.model.performance.map((e) => e.cluster_median_skip_rate)];

      const x = ['x', ...this.model.performance.map((p) => new Date(p.timestamp))];

      return {
        xFormat: '%Y-%m-%d %H:%M:%S %Z',
        vote: {
          x: 'x',
          xFormat: '%Y-%m-%d %H:%M:%S %Z',
          columns: [x, cluster_vote, validator_vote],
          type: 'spline',
        },
        root: {
          x: 'x',
          xFormat: '%Y-%m-%d %H:%M:%S %Z',
          columns: [x, cluster_root, validator_root],
          type: 'spline',
        },
        skip: {
          x: 'x',
          xFormat: '%Y-%m-%d %H:%M:%S %Z',
          columns: [x, cluster_skip, validator_skip],
          type: 'spline',
        },
      };
    } else {
      return false;
    }
  }
}
