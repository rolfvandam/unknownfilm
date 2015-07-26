var React = require('react');

var CheckBoxSet = React.createClass({
    getInitialState: function(){
        return {
            unfolded: false
        }
    },
    onCheckBoxChange: function(a){
        if( this.props.hasOwnProperty('onCheckBoxChange') ){
            this.props.onCheckBoxChange(
                this.props.label, 
                a.target.name
            );
        }
    },
    fold: function(){
        this.setState({
            unfolded: this.state.unfolded ? false : true
        });
    },
    render: function(){
        return <div>
          <div className="panel panel-default">
            <div className="panel-heading" role="tab" id={"headingOne-"+this.props.label}>
              <h4 className="panel-title">
                <a role="button" data-toggle="collapse" data-parent="#accordion" href={"#collapseOne-"+this.props.label} aria-expanded="true" aria-controls={"collapseOne-"+this.props.label}>
                  {this.props.label}
                </a>
              </h4>
            </div>
            <div id={"collapseOne-"+this.props.label} className="panel-collapse collapse" role="tabpanel" aria-labelledby={"headingOne-"+this.props.label}>
              <div className="panel-body">
                <div style={ this.state.unfolded ? {} : {height: "5em", overflow: "hidden"} }>
                    { 
                        Object.keys(this.props.options).map(
                            (key, i) => <div key={key} style={{float: "left", width: "150px"}}>
                                <input onChange={this.onCheckBoxChange} type="checkbox" name={key} checked={ this.props.options[key].value ? "checked" : "" } />
                                <span>{this.props.options[key].label}</span>
                            </div>
                        )
                    }
                </div>
                <a href="javascript:;" onClick={this.fold}>
                    { this.state.unfolded ? "Less" : "More" }
                </a>
              </div>
            </div>
          </div>
        </div>;
    }    
});

module.exports = CheckBoxSet;