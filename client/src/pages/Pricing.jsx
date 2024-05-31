const Pricing = () => {
    return (
        <section>
            <h1>Our Pricing</h1>
            <span>
                Billed Monthly <i className="fas fa-toggle-on"></i>{' '}
                <p>Billed Yearly (save 15%)</p>
            </span>
            <div className="flex flex-wrap gap-4">
                <div>
                    <h3>Free</h3>
                    <h3>$0</h3>
                    <p>
                        Description of the tier list will go here, copy should
                        be concise and impactful
                    </p>
                    <hr />
                    <span>
                        <i className="fas fa-check"></i> Amazing feature one
                    </span>
                    <span>
                        <i className="fas fa-check"></i> Wonderful feature two
                    </span>
                    <span>
                        <i className="fas fa-check"></i> Priceless feature three
                    </span>
                    <span>
                        <i className="fas fa-check"></i> Splended feature four
                    </span>
                    <button>Try for Free</button>
                </div>
                <div>
                    <h3>Pro</h3>
                    <h3>
                        $12 <sub>/ month</sub>
                    </h3>
                    <p>
                        Description of the tier list will go here, copy should
                        be concise and impactful
                    </p>
                    <hr />
                    <p>Everything in the Free plan, plus</p>
                    <span>
                        <i className="fas fa-check"></i> Amazing feature one
                    </span>
                    <span>
                        <i className="fas fa-check"></i> Wonderful feature two
                    </span>
                    <span>
                        <i className="fas fa-check"></i> Priceless feature three
                    </span>
                    <span>
                        <i className="fas fa-check"></i> Splended feature four
                    </span>
                    <span>
                        <i className="fas fa-check"></i> Delightful Feature five
                    </span>
                    <button>Subscribe Now</button>
                </div>
                <div>
                    <h3>Enterprise</h3>
                    <h3>
                        Custom <sub>yearly billing only</sub>
                    </h3>
                    <p>
                        Description of the tier list will go here, copy should
                        be concise and impactful
                    </p>
                    <hr />
                    <p>Everything in the Pro plan, plus</p>
                    <span>
                        <i className="fas fa-check"></i> Amazing feature one
                    </span>
                    <span>
                        <i className="fas fa-check"></i> Wonderful feature two
                    </span>
                    <span>
                        <i className="fas fa-check"></i> Priceless feature three
                    </span>
                    <span>
                        <i className="fas fa-check"></i> Splended feature four
                    </span>
                    <span>
                        <i className="fas fa-check"></i> Delightful feature four
                    </span>
                    <button>Contact Sales</button>
                </div>
            </div>
        </section>
    );
};

export default Pricing;
